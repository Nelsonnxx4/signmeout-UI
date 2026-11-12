import { ref } from 'vue'

import { apiRequest } from '@/lib/api'

export interface DashboardSummary {
  successfulContributionCount: number
  grossContributionsKobo: number
  totalOwnerEarningsKobo: number
  signatureCount: number
  wallet: {
    availableBalance: number
    totalEarned: number
    pendingHolds: number
    totalWithdrawn: number
    hasValidBank: boolean
    onboardingComplete: boolean
    lastWithdrawalStatus: string | null
  }
  recentTransactions: Array<{
    id: string
    reference: string
    status: string
    grossAmountKobo: number
    ownerAmountKobo: number
    platformAmountKobo: number
    createdAt: string
    paidAt: string | null
    shirt: { slug: string; shirtType: string } | null
  }>
  recentSignatures: Array<{
    id: string
    surfaceId: string
    submittedAt: string
    shirt: { slug: string; shirtType: string }
  }>
}

export interface WalletTransactions {
  entries: Array<{
    id: string
    entryType: string
    amountKobo: number
    description: string
    createdAt: string
  }>
  nextCursor: string | null
}

export function useDashboard() {
  const summary = ref<DashboardSummary | null>(null)
  const transactions = ref<WalletTransactions['entries']>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const errorMessage = ref('')
  const nextCursor = ref<string | null>(null)

  async function load() {
    loading.value = true
    errorMessage.value = ''
    try {
      const [nextSummary, wallet, ledger] = await Promise.all([
        apiRequest<DashboardSummary>('/dashboard/summary'),
        apiRequest<DashboardSummary['wallet']>('/wallet/balance'),
        apiRequest<WalletTransactions>('/wallet/transactions?limit=10'),
      ])
      summary.value = { ...nextSummary, wallet }
      transactions.value = ledger.entries
      nextCursor.value = ledger.nextCursor
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load your dashboard data.'
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!nextCursor.value || loadingMore.value) return
    loadingMore.value = true
    errorMessage.value = ''
    try {
      const cursor = encodeURIComponent(nextCursor.value)
      const ledger = await apiRequest<WalletTransactions>(
        `/wallet/transactions?limit=10&cursor=${cursor}`,
      )
      transactions.value.push(...ledger.entries)
      nextCursor.value = ledger.nextCursor
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load more wallet activity.'
    } finally {
      loadingMore.value = false
    }
  }

  return { errorMessage, load, loadMore, loading, loadingMore, nextCursor, summary, transactions }
}
