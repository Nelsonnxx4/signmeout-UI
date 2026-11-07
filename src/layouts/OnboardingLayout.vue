<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
import { useOnboardingStore } from '@/stores/onboarding'

const route = useRoute()
const onboarding = useOnboardingStore()

const activeStep = computed(() =>
  typeof route.meta.onboardingStep === 'number' ? route.meta.onboardingStep : 1,
)

const steps = computed(() => [
  {
    number: 1,
    label: 'School',
    to: '/onboarding/school',
    complete: onboarding.schoolComplete,
    available: true,
  },
  {
    number: 2,
    label: 'Bank account',
    to: '/onboarding/bank',
    complete: onboarding.bankComplete,
    available: onboarding.schoolComplete,
  },
  {
    number: 3,
    label: 'Commission',
    to: '/onboarding/commission',
    complete: onboarding.commissionAccepted,
    available: onboarding.schoolComplete && onboarding.bankComplete,
  },
])
</script>

<template>
  <div class="min-h-svh bg-[var(--ground)]">
    <header class="border-b border-[var(--border)] bg-[var(--surface)]">
      <div class="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
        <SignMeOutLogo to="/onboarding/school" />
        <RouterLink
          to="/login"
          class="rounded-[var(--radius-small)] text-sm font-semibold text-[var(--muted)] outline-none hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        >
          Exit setup
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Onboarding progress">
        <ol class="grid grid-cols-3 gap-2 sm:gap-4">
          <li v-for="step in steps" :key="step.label" class="min-w-0">
            <div
              class="h-1 rounded-full"
              :class="
                step.complete || step.number === activeStep
                  ? 'bg-[var(--brand)]'
                  : 'bg-[var(--border)]'
              "
              aria-hidden="true"
            />
            <RouterLink
              v-if="step.available && step.number !== activeStep"
              :to="step.to"
              class="mt-2 block truncate rounded text-xs font-semibold text-[var(--muted)] outline-none hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:text-sm"
            >
              {{ step.number }}. {{ step.label }}
            </RouterLink>
            <p
              v-else
              class="mt-2 truncate text-xs font-semibold sm:text-sm"
              :class="step.number === activeStep ? 'text-[var(--text)]' : 'text-[var(--muted)]'"
              :aria-current="step.number === activeStep ? 'step' : undefined"
              :aria-disabled="!step.available || undefined"
            >
              {{ step.number }}. {{ step.label }}
            </p>
          </li>
        </ol>
      </nav>

      <section
        class="mt-8 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"
      >
        <RouterView />
      </section>
    </main>
  </div>
</template>
