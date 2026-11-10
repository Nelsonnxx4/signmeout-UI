<script setup lang="ts">
import UiButton from '@/components/ui/button/UiButton.vue'
import { useWithdrawals } from '@/composables/useWithdrawals'

const {
  amountKobo,
  amountNaira,
  canSubmit,
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
} = useWithdrawals()
</script>

<template>
  <section>
    <header>
      <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
        Withdraw earnings
      </h1>
      <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
        Request a payout of your available shirt earnings to your validated bank account.
      </p>
    </header>

    <div
      v-if="errorMessage"
      role="alert"
      class="mt-6 rounded-[var(--radius-small)] border border-red-300 bg-red-50 p-4 text-sm text-red-900"
    >
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      role="status"
      class="mt-6 rounded-[var(--radius-small)] border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"
    >
      {{ successMessage }}
    </div>

    <div v-if="loading && !summary" class="mt-7 text-sm text-[var(--muted)]">
      Loading your payout details…
    </div>

    <template v-else-if="summary">
      <section
        class="mt-7 max-w-2xl rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
        aria-labelledby="request-heading"
      >
        <p class="text-sm text-[var(--muted)]">Available to withdraw</p>
        <p class="mt-1 text-3xl font-semibold tabular-nums text-[var(--text)]">
          {{ formatAmount(summary.availableBalance) }}
        </p>

        <form class="mt-6 grid gap-4" @submit.prevent="requestWithdrawal">
          <label for="withdrawal-amount" class="grid gap-2 text-sm font-medium text-[var(--text)]">
            Amount (NGN)
            <input
              id="withdrawal-amount"
              v-model.number="amountNaira"
              type="number"
              min="0.01"
              step="0.01"
              :max="summary.availableBalance / 100"
              inputmode="decimal"
              required
              class="min-h-11 rounded-[var(--radius-small)] border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            />
          </label>

          <p v-if="!summary.hasValidBank" class="text-sm text-amber-800">
            Add and validate a bank account before requesting a withdrawal.
          </p>
          <p
            v-else-if="amountKobo > summary.availableBalance"
            class="text-sm text-red-700"
            role="alert"
          >
            The requested amount exceeds your available balance.
          </p>

          <UiButton type="submit" variant="primary" :disabled="!canSubmit" :loading="submitting">
            Request withdrawal
          </UiButton>
        </form>

        <p class="mt-5 border-t border-[var(--border)] pt-4 text-sm leading-6 text-[var(--muted)]">
          After your request is accepted, we’ll initiate the payout within 10 minutes. Your bank may
          take longer to credit it.
        </p>
      </section>

      <section
        class="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
        aria-labelledby="history-heading"
      >
        <div class="border-b border-[var(--border)] px-5 py-4">
          <h2 id="history-heading" class="font-semibold text-[var(--text)]">Withdrawal history</h2>
        </div>
        <p v-if="withdrawals.length === 0" class="p-5 text-sm text-[var(--muted)]">
          No withdrawal requests yet.
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[36rem] text-left text-sm">
            <thead class="bg-[var(--raised)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th scope="col" class="px-5 py-3 font-semibold">Amount</th>
                <th scope="col" class="px-5 py-3 font-semibold">Requested</th>
                <th scope="col" class="px-5 py-3 font-semibold">Status</th>
                <th scope="col" class="px-5 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border)]">
              <tr v-for="withdrawal in withdrawals" :key="withdrawal.id">
                <td
                  class="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-[var(--text)]"
                >
                  {{ formatAmount(withdrawal.amountKobo) }}
                </td>
                <td class="whitespace-nowrap px-5 py-4 text-[var(--muted)]">
                  {{ formatDate(withdrawal.requestedAt) }}
                </td>
                <td class="px-5 py-4 text-[var(--text)]">
                  {{ formatStatus(withdrawal.status) }}
                </td>
                <td class="px-5 py-4 text-[var(--muted)]">
                  {{ withdrawal.failureReason || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>
