import { ref } from 'vue'

import { apiRequest } from '@/lib/api'

export interface DashboardSummary {
  successfulContributionCount: number
  grossContributionsKobo: number
  totalOwnerEarningsKobo: number
  signatureCount: number
  wallet: {
    availableBalance: number
    pendingBalance?: number
    withdrawnBalance?: number
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
  const errorMessage = ref('')

  async function load() {
    loading.value = true
    errorMessage.value = ''
    try {
      const [nextSummary, ledger] = await Promise.all([
        apiRequest<DashboardSummary>('/dashboard/summary'),
        apiRequest<WalletTransactions>('/wallet/transactions?limit=10'),
      ])
      summary.value = nextSummary
      transactions.value = ledger.entries
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load your dashboard data.'
    } finally {
      loading.value = false
    }
  }

  return { errorMessage, load, loading, summary, transactions }
}
