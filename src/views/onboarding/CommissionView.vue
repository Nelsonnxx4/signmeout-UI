<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { UiButton } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'
import { COMMISSION_POLICY_VERSION, useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const onboarding = useOnboardingStore()

const { handleSubmit, isSubmitting } = useForm({
  initialValues: {
    accepted: onboarding.commissionAccepted,
  },
})

const { value: accepted, errorMessage: acceptedError } = useField<boolean>(
  'accepted',
  (value) => value === true || 'Accept the 15% commission to finish setting up your account.',
)

const requestError = ref('')
const submit = handleSubmit(async () => {
  requestError.value = ''
  try {
    await apiRequest('/onboarding/commission', {
      method: 'POST',
      body: JSON.stringify({ accepted: true, policyVersion: COMMISSION_POLICY_VERSION }),
    })
    onboarding.acceptCommission()
    await router.push('/dashboard')
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not save your acceptance.'
  }
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-[var(--hero-text)]">Step 4 of 4</p>
    <h1 class="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
      Platform commission
    </h1>
    <p class="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
      SignMeOut keeps 15% of every successful payment. This applies to the gift and any signature
      enlargement fee included in the payment.
    </p>

    <section
      class="mt-8 rounded-[var(--radius-small)] bg-[var(--raised)] p-5"
      aria-labelledby="example-heading"
    >
      <h2 id="example-heading" class="text-base font-semibold text-[var(--text)]">
        Example payment
      </h2>
      <dl class="mt-4 grid gap-3 text-sm sm:text-base">
        <div class="flex items-center justify-between gap-4">
          <dt class="text-[var(--muted)]">₦5,000 gift + 4× enlargement</dt>
          <dd class="shrink-0 font-semibold tabular-nums text-[var(--text)]">₦6,000</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-[var(--muted)]">SignMeOut commission (15%)</dt>
          <dd class="shrink-0 font-semibold tabular-nums text-[var(--text)]">−₦900</dd>
        </div>
        <div class="flex items-center justify-between gap-4 pt-1">
          <dt class="font-semibold text-[var(--text)]">Your share</dt>
          <dd class="shrink-0 text-lg font-semibold tabular-nums text-[var(--text)]">₦5,100</dd>
        </div>
      </dl>
      <p class="mt-4 text-sm leading-6 text-[var(--muted)]">
        SignMeOut covers payment-processing and transfer fees from its commission. Any applicable
        taxes will be disclosed before production payments begin.
      </p>
    </section>

    <form class="mt-6" novalidate @submit="submit">
      <p v-if="requestError" role="alert" class="mb-4 text-sm font-medium text-[var(--negative)]">
        {{ requestError }}
      </p>
      <label
        for="commission-accepted"
        class="flex cursor-pointer items-start gap-3 rounded-[var(--radius-small)] border border-[var(--control)] bg-[var(--surface)] p-4"
      >
        <input
          id="commission-accepted"
          v-model="accepted"
          type="checkbox"
          name="commission-accepted"
          class="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--brand)]"
          :aria-invalid="Boolean(acceptedError) || undefined"
          :aria-describedby="acceptedError ? 'commission-error' : 'commission-help'"
        />
        <span>
          <span class="block font-semibold text-[var(--text)]">
            I accept the 15% platform commission.
          </span>
          <span id="commission-help" class="mt-1 block text-sm leading-6 text-[var(--muted)]">
            My acceptance can be stored with the policy version and acceptance time.
          </span>
        </span>
      </label>

      <p
        v-if="acceptedError"
        id="commission-error"
        role="alert"
        class="mt-2 text-sm font-medium text-[var(--negative)]"
      >
        {{ acceptedError }}
      </p>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <UiButton size="lg" @click="router.push('/onboarding/bank')">
          <ArrowLeft aria-hidden="true" />
          Back
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="isSubmitting"
          class="justify-between"
        >
          Finish setup
          <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
        </UiButton>
      </div>
    </form>
  </div>
</template>
