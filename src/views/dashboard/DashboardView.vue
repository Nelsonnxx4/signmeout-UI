<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { buttonVariants } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'

const onboarding = useOnboardingStore()
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">Dashboard</h1>
    <p class="mt-2 text-base text-[var(--muted)]">
      Your shirts, gifts, signatures, and available balance will live here.
    </p>

    <div
      class="mt-8 max-w-2xl rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
    >
      <template v-if="onboarding.isComplete">
        <h2 class="text-lg font-semibold text-[var(--text)]">Owner setup complete</h2>
        <p class="mt-2 leading-7 text-[var(--muted)]">
          Your onboarding details are ready for backend verification. Shirt creation is the next
          product slice.
        </p>

        <dl class="mt-5 grid gap-3 rounded-[var(--radius-small)] bg-[var(--raised)] p-4 text-sm">
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[var(--muted)]">School</dt>
            <dd class="text-right font-semibold text-[var(--text)]">{{ onboarding.school }}</dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[var(--muted)]">Department</dt>
            <dd class="text-right font-semibold text-[var(--text)]">
              {{ onboarding.department }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[var(--muted)]">Payout account</dt>
            <dd class="text-right font-semibold text-[var(--text)]">
              {{ onboarding.bankName }} ···· {{ onboarding.accountLast4 }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4">
            <dt class="text-[var(--muted)]">Platform commission</dt>
            <dd class="text-right font-semibold tabular-nums text-[var(--text)]">10%</dd>
          </div>
        </dl>

        <RouterLink
          to="/onboarding/school"
          :class="buttonVariants({ variant: 'secondary', size: 'md' })"
          class="mt-5"
        >
          Review setup
        </RouterLink>
      </template>

      <template v-else>
        <h2 class="text-lg font-semibold text-[var(--text)]">Complete owner setup first</h2>
        <p class="mt-2 leading-7 text-[var(--muted)]">
          Add your school, bank account, and accept the 10% platform commission before creating your
          first virtual shirt.
        </p>
        <RouterLink
          :to="onboarding.nextRoute"
          :class="buttonVariants({ variant: 'primary', size: 'md' })"
          class="mt-5"
        >
          Continue onboarding
        </RouterLink>
      </template>
    </div>
  </section>
</template>
