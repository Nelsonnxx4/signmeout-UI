<script setup lang="ts">
import UiButton from '@/components/ui/button/UiButton.vue'
import { useWithdrawals } from '@/composables/useWithdrawals'

const {
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
} = useWithdrawals()

function confirmCancel(withdrawalId: string) {
  if (!window.confirm('Cancel this withdrawal request? Its reserved funds will be released.')) {
    return
  }
  void cancelWithdrawal(withdrawalId)
}
</script>

<template>
  <section>
    <header>
      <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
        Withdraw earnings
      </h1>
      <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
        Request a payout of your available shirt earnings to your validated bank account. There is
        no additional student-verification step.
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
          Your payout will be initiated within 10 minutes. Your bank may take longer to credit it.
          You can cancel while the request is pending and transfer processing has not started.
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
          <table class="w-full min-w-[44rem] text-left text-sm">
            <thead class="bg-[var(--raised)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th scope="col" class="px-5 py-3 font-semibold">Amount</th>
                <th scope="col" class="px-5 py-3 font-semibold">Requested</th>
                <th scope="col" class="px-5 py-3 font-semibold">Status</th>
                <th scope="col" class="px-5 py-3 font-semibold">Details</th>
                <th scope="col" class="px-5 py-3 font-semibold">Action</th>
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
                <td class="px-5 py-4">
                  <button
                    v-if="withdrawal.status === 'PENDING' && !withdrawal.transferReference"
                    type="button"
                    :disabled="cancellingWithdrawalId === withdrawal.id"
                    class="min-h-10 rounded-[var(--radius-small)] border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                    :aria-label="`Cancel withdrawal ${withdrawal.id}`"
                    @click="confirmCancel(withdrawal.id)"
                  >
                    {{ cancellingWithdrawalId === withdrawal.id ? 'Cancelling…' : 'Cancel' }}
                  </button>
                  <span v-else class="text-[var(--muted)]">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>
