<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { buttonVariants } from '@/components/ui/button'

type WithdrawalStatus =
  'PENDING' | 'PROCESSING' | 'REQUIRES_ACTION' | 'PAID' | 'FAILED' | 'REVERSED' | 'CANCELLED'

interface Withdrawal {
  id: string
  userId: string
  amountKobo: number
  status: WithdrawalStatus
  requestedAt: string
  processedAt: string | null
  failureReason: string | null
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

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
const withdrawals = ref<Withdrawal[]>([])
const statusFilter = ref<'ALL' | WithdrawalStatus>('ALL')
const loading = ref(false)
const errorMessage = ref('')

const filteredWithdrawals = computed(() =>
  statusFilter.value === 'ALL'
    ? withdrawals.value
    : withdrawals.value.filter((withdrawal) => withdrawal.status === statusFilter.value),
)

const pendingCount = computed(
  () => withdrawals.value.filter((withdrawal) => withdrawal.status === 'PENDING').length,
)
const processingCount = computed(
  () => withdrawals.value.filter((withdrawal) => withdrawal.status === 'PROCESSING').length,
)

function isWithdrawal(value: unknown): value is Withdrawal {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.amountKobo === 'number' &&
    Number.isFinite(record.amountKobo) &&
    typeof record.status === 'string' &&
    withdrawalStatuses.some((status) => status === record.status) &&
    typeof record.requestedAt === 'string' &&
    (typeof record.processedAt === 'string' || record.processedAt === null) &&
    (typeof record.failureReason === 'string' || record.failureReason === null)
  )
}

async function loadWithdrawals() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/admin/withdrawals`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })

    if (response.status === 401) {
      throw new Error('Sign in with an administrator account to view withdrawal requests.')
    }
    if (response.status === 403) {
      throw new Error('Your account does not have permission to view withdrawal requests.')
    }
    if (!response.ok) {
      throw new Error(`Could not load withdrawal requests (HTTP ${response.status}).`)
    }

    const payload: unknown = await response.json()
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('success' in payload) ||
      payload.success !== true ||
      !('data' in payload)
    ) {
      throw new Error('The server returned an invalid withdrawal response.')
    }

    const data = payload.data
    if (!Array.isArray(data) || !data.every(isWithdrawal)) {
      throw new Error('The server returned an invalid withdrawal list.')
    }

    withdrawals.value = data
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while loading requests.'
  } finally {
    loading.value = false
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

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function statusClass(status: WithdrawalStatus) {
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-800'
  if (status === 'FAILED' || status === 'REVERSED') return 'bg-red-100 text-red-800'
  if (status === 'REQUIRES_ACTION') return 'bg-orange-100 text-orange-800'
  if (status === 'PENDING' || status === 'PROCESSING') return 'bg-amber-100 text-amber-900'
  return 'bg-[var(--raised)] text-[var(--muted)]'
}

function formatStatus(status: WithdrawalStatus) {
  return status.replace('_', ' ')
}

onMounted(loadWithdrawals)
</script>

<template>
  <section>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-[var(--brand-strong)]">Admin workspace</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
          Withdrawal requests
        </h1>
        <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Monitor payout requests and their current processing status.
        </p>
      </div>

      <button
        type="button"
        :class="buttonVariants({ variant: 'secondary', size: 'sm' })"
        :disabled="loading"
        @click="loadWithdrawals"
      >
        {{ loading ? 'Refreshing…' : 'Refresh requests' }}
      </button>
    </header>

    <div
      class="mt-7 grid gap-4 sm:grid-cols-3"
      aria-label="Withdrawal request summary"
      aria-live="polite"
    >
      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <p class="text-sm text-[var(--muted)]">All requests</p>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">
          {{ withdrawals.length }}
        </p>
      </div>
      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <p class="text-sm text-[var(--muted)]">Pending</p>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">
          {{ pendingCount }}
        </p>
      </div>
      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <p class="text-sm text-[var(--muted)]">Processing</p>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">
          {{ processingCount }}
        </p>
      </div>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="mt-6 rounded-[var(--radius-small)] border border-red-300 bg-red-50 p-4 text-sm text-red-900"
    >
      {{ errorMessage }}
    </div>

    <section
      class="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
      aria-labelledby="requests-heading"
    >
      <div
        class="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 id="requests-heading" class="font-semibold text-[var(--text)]">Request queue</h2>
          <p class="mt-1 text-sm text-[var(--muted)]">{{ filteredWithdrawals.length }} shown</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--muted)]">
          Status
          <select
            v-model="statusFilter"
            class="min-h-10 rounded-[var(--radius-small)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            <option value="ALL">All statuses</option>
            <option v-for="status in withdrawalStatuses" :key="status" :value="status">
              {{ formatStatus(status) }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="loading && withdrawals.length === 0" class="p-6 text-sm text-[var(--muted)]">
        Loading withdrawal requests…
      </p>
      <p
        v-else-if="!errorMessage && filteredWithdrawals.length === 0"
        class="p-6 text-sm text-[var(--muted)]"
      >
        {{ withdrawals.length ? 'No requests match this status.' : 'No withdrawal requests yet.' }}
      </p>
      <p
        v-else-if="errorMessage && withdrawals.length === 0"
        class="p-6 text-sm text-[var(--muted)]"
      >
        Request list unavailable. Try refreshing.
      </p>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[48rem] text-left text-sm">
          <thead class="bg-[var(--raised)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th scope="col" class="px-5 py-3 font-semibold">Request</th>
              <th scope="col" class="px-5 py-3 font-semibold">Owner ID</th>
              <th scope="col" class="px-5 py-3 font-semibold">Amount</th>
              <th scope="col" class="px-5 py-3 font-semibold">Requested</th>
              <th scope="col" class="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border)]">
            <tr v-for="withdrawal in filteredWithdrawals" :key="withdrawal.id">
              <td class="max-w-48 break-all px-5 py-4 font-mono text-xs text-[var(--muted)]">
                {{ withdrawal.id }}
              </td>
              <td class="max-w-48 break-all px-5 py-4 font-mono text-xs text-[var(--muted)]">
                {{ withdrawal.userId }}
              </td>
              <td class="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-[var(--text)]">
                {{ formatAmount(withdrawal.amountKobo) }}
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-[var(--muted)]">
                {{ formatDate(withdrawal.requestedAt) }}
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="statusClass(withdrawal.status)"
                >
                  {{ formatStatus(withdrawal.status) }}
                </span>
                <p
                  v-if="withdrawal.failureReason"
                  class="mt-1 max-w-48 text-xs text-red-700"
                  :title="withdrawal.failureReason"
                >
                  {{ withdrawal.failureReason }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
