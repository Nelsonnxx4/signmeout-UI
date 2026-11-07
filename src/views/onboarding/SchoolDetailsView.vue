<script setup lang="ts">
import { ArrowRight, BookOpen, School } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { UiSelect } from '@/components/ui/select'
import { DEPARTMENT_OPTIONS, OTHER_OPTION, SCHOOL_OPTIONS } from '@/data/onboardingOptions'
import { toFieldValidator } from '@/lib/validation'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const onboarding = useOnboardingStore()

const hasKnownSchool = SCHOOL_OPTIONS.some((option) => option === onboarding.school)
const hasKnownDepartment = DEPARTMENT_OPTIONS.some((option) => option === onboarding.department)

const initialSchool = hasKnownSchool ? onboarding.school : onboarding.school ? OTHER_OPTION : ''
const initialDepartment = hasKnownDepartment
  ? onboarding.department
  : onboarding.department
    ? OTHER_OPTION
    : ''

const requiredSelection = (field: string) =>
  toFieldValidator(z.string().min(1, `Choose your ${field}.`))
const customValue = (field: string) =>
  toFieldValidator(
    z.string().trim().min(2, `Enter your ${field}.`).max(120, `${field} is too long.`),
  )

const { handleSubmit, isSubmitting } = useForm({
  initialValues: {
    school: initialSchool,
    otherSchool: hasKnownSchool ? '' : onboarding.school,
    department: initialDepartment,
    otherDepartment: hasKnownDepartment ? '' : onboarding.department,
  },
})

const {
  value: school,
  errorMessage: schoolError,
  handleBlur: handleSchoolBlur,
} = useField<string>('school', requiredSelection('school'))
const {
  value: otherSchool,
  errorMessage: otherSchoolError,
  handleBlur: handleOtherSchoolBlur,
} = useField<string>('otherSchool', (value) => {
  if (school.value !== OTHER_OPTION) return true
  return customValue('school name')(value)
})
const {
  value: department,
  errorMessage: departmentError,
  handleBlur: handleDepartmentBlur,
} = useField<string>('department', requiredSelection('department'))
const {
  value: otherDepartment,
  errorMessage: otherDepartmentError,
  handleBlur: handleOtherDepartmentBlur,
} = useField<string>('otherDepartment', (value) => {
  if (department.value !== OTHER_OPTION) return true
  return customValue('department name')(value)
})

const submit = handleSubmit(async () => {
  onboarding.saveSchool({
    school: school.value === OTHER_OPTION ? otherSchool.value.trim() : school.value,
    department: department.value === OTHER_OPTION ? otherDepartment.value.trim() : department.value,
  })

  await router.push('/onboarding/bank')
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-[var(--hero-text)]">Step 1 of 3</p>
    <h1 class="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
      School and department
    </h1>
    <p class="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
      Tell us where you study so your shirt and future student verification use the right school
      details.
    </p>

    <form class="mt-8 grid gap-6" novalidate @submit="submit">
      <FormField
        v-slot="{ messageId }"
        for="school"
        label="School"
        hint="Choose your school, or add it if it is not listed yet."
        :error="schoolError"
        required
      >
        <UiSelect
          id="school"
          v-model="school"
          name="school"
          autocomplete="organization"
          :invalid="Boolean(schoolError)"
          :aria-describedby="messageId"
          @blur="handleSchoolBlur($event, true)"
        >
          <template #leading><School /></template>
          <option value="" disabled>Choose your school</option>
          <option v-for="option in SCHOOL_OPTIONS" :key="option" :value="option">
            {{ option }}
          </option>
          <option :value="OTHER_OPTION">My school isn’t listed</option>
        </UiSelect>
      </FormField>

      <FormField
        v-if="school === OTHER_OPTION"
        v-slot="{ messageId }"
        for="other-school"
        label="School name"
        :error="otherSchoolError"
        required
      >
        <UiInput
          id="other-school"
          v-model="otherSchool"
          name="other-school"
          autocomplete="organization"
          placeholder="Enter your school name"
          :invalid="Boolean(otherSchoolError)"
          :aria-describedby="messageId"
          @blur="handleOtherSchoolBlur($event, true)"
        >
          <template #leading><School /></template>
        </UiInput>
      </FormField>

      <FormField
        v-slot="{ messageId }"
        for="department"
        label="Department"
        hint="Use the department name shown by your school."
        :error="departmentError"
        required
      >
        <UiSelect
          id="department"
          v-model="department"
          name="department"
          :invalid="Boolean(departmentError)"
          :aria-describedby="messageId"
          @blur="handleDepartmentBlur($event, true)"
        >
          <template #leading><BookOpen /></template>
          <option value="" disabled>Choose your department</option>
          <option v-for="option in DEPARTMENT_OPTIONS" :key="option" :value="option">
            {{ option }}
          </option>
          <option :value="OTHER_OPTION">My department isn’t listed</option>
        </UiSelect>
      </FormField>

      <FormField
        v-if="department === OTHER_OPTION"
        v-slot="{ messageId }"
        for="other-department"
        label="Department name"
        :error="otherDepartmentError"
        required
      >
        <UiInput
          id="other-department"
          v-model="otherDepartment"
          name="other-department"
          placeholder="Enter your department name"
          :invalid="Boolean(otherDepartmentError)"
          :aria-describedby="messageId"
          @blur="handleOtherDepartmentBlur($event, true)"
        >
          <template #leading><BookOpen /></template>
        </UiInput>
      </FormField>

      <UiButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="isSubmitting"
        class="mt-1 justify-between sm:ml-auto sm:w-auto"
      >
        Continue to bank account
        <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
      </UiButton>
    </form>
  </div>
</template>
