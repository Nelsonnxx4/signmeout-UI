<script setup lang="ts">
import { ArrowLeft, ArrowRight, BadgeCheck, FileText, UserRound } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { toFieldValidator } from '@/lib/validation'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const onboarding = useOnboardingStore()

const { handleSubmit, isSubmitting } = useForm({
  initialValues: {
    studentFullName: onboarding.studentFullName,
    admissionNumber: onboarding.admissionNumber,
    nickname: onboarding.nickname,
  },
})

const {
  value: studentFullName,
  errorMessage: studentFullNameError,
  handleBlur: handleStudentFullNameBlur,
} = useField<string>(
  'studentFullName',
  toFieldValidator(
    z
      .string()
      .trim()
      .min(2, 'Enter your full name.')
      .max(180, 'Full name is too long.'),
  ),
)

const {
  value: admissionNumber,
  errorMessage: admissionNumberError,
  handleBlur: handleAdmissionNumberBlur,
} = useField<string>(
  'admissionNumber',
  toFieldValidator(
    z
      .string()
      .trim()
      .min(3, 'Enter your admission number.')
      .max(40, 'Admission number is too long.')
      .regex(/^[A-Za-z0-9/-]+$/, 'Use letters, numbers, and - or / only.'),
  ),
)

const {
  value: nickname,
  errorMessage: nicknameError,
  handleBlur: handleNicknameBlur,
} = useField<string>('nickname', (value) => {
  if (!value) return true
  return toFieldValidator(
    z.string().trim().min(2, 'Nickname is too short.').max(40, 'Nickname is too long.'),
  )(value)
})

const submit = handleSubmit(async () => {
  onboarding.saveStudentDetails({
    fullName: studentFullName.value.trim(),
    admissionNumber: admissionNumber.value.trim(),
    nickname: nickname.value.trim(),
  })

  await router.push('/onboarding/bank')
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-[var(--hero-text)]">Step 2 of 4</p>
    <h1 class="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
      Student details
    </h1>
    <p class="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
      Add your student identity details so your account can be matched to your course record. You can
      skip the nickname if you prefer not to use one.
    </p>

    <form class="mt-8 grid gap-6" novalidate @submit="submit">
      <FormField
        v-slot="{ messageId }"
        for="student-full-name"
        label="Full name"
        hint="Use the exact name on your school records."
        :error="studentFullNameError"
        required
      >
        <UiInput
          id="student-full-name"
          v-model="studentFullName"
          name="student-full-name"
          autocomplete="name"
          placeholder="Your full legal name"
          :invalid="Boolean(studentFullNameError)"
          :aria-describedby="messageId"
          @blur="handleStudentFullNameBlur($event, true)"
        >
          <template #leading><UserRound /></template>
        </UiInput>
      </FormField>

      <FormField
        v-slot="{ messageId }"
        for="admission-number"
        label="Admission number"
        hint="Use your student admission number, including letters or numbers."
        :error="admissionNumberError"
        required
      >
        <UiInput
          id="admission-number"
          v-model="admissionNumber"
          name="admission-number"
          autocomplete="off"
          placeholder="e.g. SCI/2026/0148"
          :invalid="Boolean(admissionNumberError)"
          :aria-describedby="messageId"
          @blur="handleAdmissionNumberBlur($event, true)"
        >
          <template #leading><BadgeCheck /></template>
        </UiInput>
      </FormField>

      <FormField
        v-slot="{ messageId }"
        for="nickname"
        label="Nickname (optional)"
        hint="This helps friends recognize you when they sign your shirt."
        :error="nicknameError"
      >
        <UiInput
          id="nickname"
          v-model="nickname"
          name="nickname"
          autocomplete="nickname"
          placeholder="Your nickname"
          :invalid="Boolean(nicknameError)"
          :aria-describedby="messageId"
          @blur="handleNicknameBlur($event, true)"
        >
          <template #leading><FileText /></template>
        </UiInput>
      </FormField>

      <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <UiButton size="lg" @click="router.push('/onboarding/school')">
          <ArrowLeft aria-hidden="true" />
          Back
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="isSubmitting"
          class="justify-between sm:ml-auto sm:w-auto"
        >
          Continue to bank account
          <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
        </UiButton>
      </div>
    </form>
  </div>
</template>
