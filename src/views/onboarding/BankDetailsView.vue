<script setup lang="ts">
import { ArrowLeft, ArrowRight, Hash, Landmark, UserRound } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { UiSelect } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toFieldValidator } from '@/lib/validation'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const onboarding = useOnboardingStore()

interface BankOption {
  code: string
  name: string
}

const banks = ref<BankOption[]>([])
const loadingBanks = ref(true)
const requestError = ref('')

onMounted(async () => {
  try {
    banks.value = await apiRequest<BankOption[]>('/banks')
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not load banks.'
  } finally {
    loadingBanks.value = false
  }
})

const { handleSubmit, isSubmitting } = useForm({
  initialValues: {
    bankCode: onboarding.bankCode,
    accountNumber: onboarding.accountNumber,
    accountName: onboarding.accountName,
  },
})

const {
  value: bankCode,
  errorMessage: bankError,
  handleBlur: handleBankBlur,
} = useField<string>('bankCode', toFieldValidator(z.string().min(1, 'Choose your bank.')))
const {
  value: accountNumber,
  errorMessage: accountNumberError,
  handleBlur: handleAccountNumberBlur,
} = useField<string>('accountNumber', (value) => {
  const savedAccountStillApplies =
    !value && onboarding.bankComplete && bankCode.value === onboarding.bankCode

  if (savedAccountStillApplies) return true

  return toFieldValidator(
    z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'Enter a valid 10-digit account number.'),
  )(value)
})
const {
  value: accountName,
  errorMessage: accountNameError,
  handleBlur: handleAccountNameBlur,
} = useField<string>(
  'accountName',
  toFieldValidator(
    z
      .string()
      .trim()
      .min(2, 'Enter the account holder’s name.')
      .max(120, 'Account holder name is too long.'),
  ),
)

const accountNumberHint = computed(() => {
  if (onboarding.accountLast4 && !accountNumber.value) {
    return `Your saved payout account ends in ${onboarding.accountLast4}. Enter a new number only to replace it.`
  }

  return 'Use a personal naira account that can receive payouts.'
})

const submit = handleSubmit(async () => {
  const selectedBank = banks.value.find((bank) => bank.code === bankCode.value)
  if (!selectedBank) {
    requestError.value = 'Choose a bank from the available list.'
    return
  }

  requestError.value = ''
  try {
    const resolved = await apiRequest<{ accountName: string }>('/banks/resolve', {
      method: 'POST',
      body: JSON.stringify({ accountNumber: accountNumber.value, bankCode: bankCode.value }),
    })
    accountName.value = resolved.accountName
    await apiRequest('/onboarding/bank', {
      method: 'POST',
      body: JSON.stringify({ accountNumber: accountNumber.value, bankCode: bankCode.value }),
    })
    onboarding.saveBank({
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountNumber: accountNumber.value || undefined,
      accountName: resolved.accountName,
    })
    await router.push('/onboarding/commission')
  } catch (error) {
    requestError.value =
      error instanceof Error ? error.message : 'Could not verify or save this account.'
  }
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-[var(--hero-text)]">Step 3 of 4</p>
    <h1 class="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">Bank account</h1>
    <p class="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
      Add the naira account where your cleared shirt earnings should be paid. The account name will
      be confirmed through the payment provider before withdrawals are enabled.
    </p>

    <form class="mt-8 grid gap-6" novalidate @submit="submit">
      <p v-if="loadingBanks" class="text-sm text-[var(--muted)]" role="status">Loading banks…</p>
      <p v-if="requestError" role="alert" class="text-sm font-medium text-[var(--negative)]">
        {{ requestError }}
      </p>
      <FormField v-slot="{ messageId }" for="bank" label="Bank" :error="bankError" required>
        <UiSelect
          id="bank"
          v-model="bankCode"
          name="bank"
          :invalid="Boolean(bankError)"
          :aria-describedby="messageId"
          @blur="handleBankBlur($event, true)"
        >
          <template #leading><Landmark /></template>
          <option value="" disabled>Choose your bank</option>
          <option v-for="bank in banks" :key="bank.code" :value="bank.code">
            {{ bank.name }}
          </option>
        </UiSelect>
      </FormField>

      <FormField
        v-slot="{ messageId }"
        for="account-number"
        label="Account number"
        :hint="accountNumberHint"
        :error="accountNumberError"
        required
      >
        <UiInput
          id="account-number"
          v-model="accountNumber"
          name="account-number"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="10"
          placeholder="0123456789"
          :invalid="Boolean(accountNumberError)"
          :aria-describedby="messageId"
          @blur="handleAccountNumberBlur($event, true)"
        >
          <template #leading><Hash /></template>
        </UiInput>
      </FormField>

      <FormField
        v-slot="{ messageId }"
        for="account-name"
        label="Account holder name"
        hint="Enter the name exactly as it appears on the bank account."
        :error="accountNameError"
        required
      >
        <UiInput
          id="account-name"
          v-model="accountName"
          name="account-name"
          type="text"
          autocomplete="name"
          placeholder="Account holder name"
          :invalid="Boolean(accountNameError)"
          :aria-describedby="messageId"
          @blur="handleAccountNameBlur($event, true)"
        >
          <template #leading><UserRound /></template>
        </UiInput>
      </FormField>

      <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <UiButton size="lg" @click="router.push('/onboarding/student')">
          <ArrowLeft aria-hidden="true" />
          Back
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="isSubmitting || loadingBanks"
          :disabled="loadingBanks || Boolean(requestError)"
          class="justify-between"
        >
          Review commission
          <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
        </UiButton>
      </div>
    </form>
  </div>
</template>
