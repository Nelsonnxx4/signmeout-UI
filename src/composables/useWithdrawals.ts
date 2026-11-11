import { computed, onMounted, ref } from 'vue'

type WithdrawalStatus =
  'PENDING' | 'PROCESSING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'REVERSED' | 'CANCELLED'

interface WithdrawalSummary {
  availableBalance: number
  hasValidBank: boolean
}

interface Withdrawal {
  id: string
  amountKobo: number
  status: WithdrawalStatus
  requestedAt: string
  adminResponseDeadline: string | null
  processedAt: string | null
  failureReason: string | null
  transferReference: string | null
}

const withdrawalStatuses: WithdrawalStatus[] = [
  'PENDING',
  'PROCESSING',
  'REQUIRES_ACTION',
  'PAID',
  'FAILED',
  'REVERSED',
  'CANCELLED',
]
const payoutNotice =
  'Your payout will be initiated within 10 minutes. Your bank may take longer to credit it.'
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export function useWithdrawals() {
  const summary = ref<WithdrawalSummary | null>(null)
  const withdrawals = ref<Withdrawal[]>([])
  const amountNaira = ref<number | ''>('')
  const loading = ref(false)
  const submitting = ref(false)
  const cancellingWithdrawalId = ref<string | null>(null)
  const errorMessage = ref('')
  const successMessage = ref('')

  const amountKobo = computed(() =>
    typeof amountNaira.value === 'number' ? Math.round(amountNaira.value * 100) : 0,
  )
  const canSubmit = computed(
    () =>
      !loading.value &&
      !submitting.value &&
      summary.value?.hasValidBank === true &&
      Number.isSafeInteger(amountKobo.value) &&
      amountKobo.value > 0 &&
      amountKobo.value <= (summary.value?.availableBalance ?? 0),
  )

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  function parseSummary(value: unknown): WithdrawalSummary | null {
    if (
      !isRecord(value) ||
      typeof value.availableBalance !== 'number' ||
      !Number.isSafeInteger(value.availableBalance) ||
      typeof value.hasValidBank !== 'boolean'
    ) {
      return null
    }

    return {
      availableBalance: value.availableBalance,
      hasValidBank: value.hasValidBank,
    }
  }

  function isWithdrawal(value: unknown): value is Withdrawal {
    if (!isRecord(value)) return false

    return (
      typeof value.id === 'string' &&
      typeof value.amountKobo === 'number' &&
      Number.isSafeInteger(value.amountKobo) &&
      typeof value.status === 'string' &&
      withdrawalStatuses.some((status) => status === value.status) &&
      typeof value.requestedAt === 'string' &&
      (typeof value.adminResponseDeadline === 'string' || value.adminResponseDeadline === null) &&
      (typeof value.processedAt === 'string' || value.processedAt === null) &&
      (typeof value.failureReason === 'string' || value.failureReason === null) &&
      (typeof value.transferReference === 'string' || value.transferReference === null)
    )
  }

  async function readData(response: Response): Promise<unknown> {
    const payload: unknown = await response.json()
    if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
      throw new Error('The server returned an invalid withdrawal response.')
    }
    return payload.data
  }

  async function responseError(response: Response): Promise<string> {
    if (response.status === 401) return 'Sign in to request a withdrawal.'

    const payload: unknown = await response.json().catch(() => null)
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    return `Could not complete the request (HTTP ${response.status}).`
  }

  async function loadWithdrawals() {
    loading.value = true
    errorMessage.value = ''

    try {
      const [summaryResponse, historyResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/withdrawals/summary`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        fetch(`${apiBaseUrl}/api/v1/withdrawals`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
      ])

      if (!summaryResponse.ok) throw new Error(await responseError(summaryResponse))
      if (!historyResponse.ok) throw new Error(await responseError(historyResponse))

      const [summaryData, historyData] = await Promise.all([
        readData(summaryResponse),
        readData(historyResponse),
      ])
      const nextSummary = parseSummary(summaryData)
      if (!nextSummary || !Array.isArray(historyData) || !historyData.every(isWithdrawal)) {
        throw new Error('The server returned invalid withdrawal account data.')
      }

      summary.value = nextSummary
      withdrawals.value = historyData
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while loading withdrawals.'
    } finally {
      loading.value = false
    }
  }

  async function requestWithdrawal() {
    if (!canSubmit.value) return

    submitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/withdrawals`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountKobo: amountKobo.value,
          idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `withdrawal-${Date.now()}`,
        }),
      })

      if (!response.ok) throw new Error(await responseError(response))

      const data = await readData(response)
      if (!isWithdrawal(data)) {
        throw new Error('The server returned an invalid withdrawal request.')
      }

      successMessage.value = payoutNotice
      amountNaira.value = ''
      await loadWithdrawals()
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while requesting payout.'
    } finally {
      submitting.value = false
    }
  }

  async function cancelWithdrawal(withdrawalId: string) {
    if (cancellingWithdrawalId.value) return
    cancellingWithdrawalId.value = withdrawalId
    errorMessage.value = ''
    successMessage.value = ''
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/withdrawals/${encodeURIComponent(withdrawalId)}/cancel`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        },
      )

      if (!response.ok) throw new Error(await responseError(response))

      const data = await readData(response)
      if (!isWithdrawal(data)) {
        throw new Error('The server returned an invalid withdrawal response.')
      }

      successMessage.value = 'Withdrawal cancelled. The reserved funds are available again.'
      await loadWithdrawals()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not cancel this withdrawal.'
    } finally {
      cancellingWithdrawalId.value = null
    }
  }

  function formatAmount(amountKobo: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2,
    }).format(amountKobo / 100)
  }

  function formatDate(value: string) {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return 'Invalid date'
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      date,
    )
  }

  function formatStatus(status: WithdrawalStatus) {
    return status.replace('_', ' ')
  }

  onMounted(loadWithdrawals)

  return {
    amountKobo,
    amountNaira,
    canSubmit,
    cancellingWithdrawalId,
    cancelWithdrawal,
    errorMessage,
    formatAmount,
    formatDate,
    formatStatus,
    loading,
    requestWithdrawal,
    submitting,
    successMessage,
    summary,
    withdrawals,
  }
}
