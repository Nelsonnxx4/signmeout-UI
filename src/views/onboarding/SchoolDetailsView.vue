<script setup lang="ts">
import { ArrowRight, BookOpen, School } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { UiSelect } from '@/components/ui/select'
import { OTHER_OPTION } from '@/data/onboardingOptions'
import { apiRequest } from '@/lib/api'
import { toFieldValidator } from '@/lib/validation'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const onboarding = useOnboardingStore()

interface SchoolOption {
  id: string
  name: string
}

interface DepartmentOption {
  id: string
  name: string
}

const schools = ref<SchoolOption[]>([])
const departments = ref<DepartmentOption[]>([])
const loadingOptions = ref(true)
const requestError = ref('')
const hasKnownSchool = ref(false)
const hasKnownDepartment = ref(false)

const requiredSelection = (field: string) =>
  toFieldValidator(z.string().min(1, `Choose your ${field}.`))
const customValue = (field: string) =>
  toFieldValidator(
    z.string().trim().min(2, `Enter your ${field}.`).max(120, `${field} is too long.`),
  )

const { handleSubmit, isSubmitting } = useForm({
  initialValues: {
    school: onboarding.school,
    otherSchool: '',
    department: onboarding.department,
    otherDepartment: '',
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

async function loadDepartments(schoolName: string) {
  const selectedSchool = schools.value.find((option) => option.name === schoolName)
  const nextDepartments = selectedSchool
    ? await apiRequest<DepartmentOption[]>(
        `/schools/${encodeURIComponent(selectedSchool.id)}/departments`,
      )
    : []
  if (school.value !== schoolName) return
  departments.value = nextDepartments
  hasKnownDepartment.value = departments.value.some(
    (option) => option.name === onboarding.department,
  )
}

watch(school, async (value) => {
  requestError.value = ''
  department.value = ''
  departments.value = []
  hasKnownSchool.value = schools.value.some((option) => option.name === value)
  if (value && value !== OTHER_OPTION) {
    try {
      await loadDepartments(value)
    } catch (error) {
      requestError.value =
        error instanceof Error ? error.message : 'Could not load departments for this school.'
    }
  }
})

onMounted(async () => {
  try {
    schools.value = await apiRequest<SchoolOption[]>('/schools')
    hasKnownSchool.value = schools.value.some((option) => option.name === onboarding.school)
    if (onboarding.school && !hasKnownSchool.value) {
      school.value = OTHER_OPTION
      otherSchool.value = onboarding.school
    }
    if (hasKnownSchool.value) {
      await loadDepartments(onboarding.school)
      hasKnownDepartment.value = departments.value.some(
        (option) => option.name === onboarding.department,
      )
      if (onboarding.department && !hasKnownDepartment.value) {
        department.value = OTHER_OPTION
        otherDepartment.value = onboarding.department
      }
    } else if (onboarding.department) {
      department.value = OTHER_OPTION
      otherDepartment.value = onboarding.department
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not load schools.'
  } finally {
    loadingOptions.value = false
  }
})

const submit = handleSubmit(async () => {
  const selectedSchool = schools.value.find((option) => option.name === school.value)
  const selectedDepartment = departments.value.find((option) => option.name === department.value)
  const payload: {
    schoolId?: string
    customSchoolName?: string
    departmentId?: string
    customDepartmentName?: string
  } = {
    ...(school.value === OTHER_OPTION
      ? { customSchoolName: otherSchool.value.trim() }
      : selectedSchool?.id
        ? { schoolId: selectedSchool.id }
        : {}),
    ...(department.value === OTHER_OPTION
      ? { customDepartmentName: otherDepartment.value.trim() }
      : selectedDepartment?.id
        ? { departmentId: selectedDepartment.id }
        : {}),
  }

  if (!payload.schoolId && !payload.customSchoolName) {
    requestError.value = 'Choose a school from the server list or enter another school.'
    return
  }
  if (!payload.departmentId && !payload.customDepartmentName) {
    requestError.value = 'Choose a department from the selected school or enter another department.'
    return
  }

  requestError.value = ''
  try {
    await apiRequest('/onboarding/profile', { method: 'PATCH', body: JSON.stringify(payload) })
    onboarding.saveSchool({
      school: selectedSchool?.name ?? otherSchool.value.trim(),
      department: selectedDepartment?.name ?? otherDepartment.value.trim(),
    })
    await router.push('/onboarding/student')
  } catch (error) {
    requestError.value =
      error instanceof Error ? error.message : 'Could not save your school details.'
  }
})
</script>

<template>
  <div>
    <p class="text-sm font-semibold text-[var(--hero-text)]">Step 1 of 4</p>
    <h1 class="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
      School and department
    </h1>
    <p class="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
      Tell us where you study so we can personalize your shirt and account details.
    </p>

    <form class="mt-8 grid gap-6" novalidate @submit="submit">
      <p v-if="loadingOptions" class="text-sm text-[var(--muted)]" role="status">
        Loading schools…
      </p>
      <p v-if="requestError" role="alert" class="text-sm font-medium text-[var(--negative)]">
        {{ requestError }}
      </p>
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
          <option v-for="option in schools" :key="option.id" :value="option.name">
            {{ option.name }}
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
          <option v-for="option in departments" :key="option.id" :value="option.name">
            {{ option.name }}
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
        :loading="isSubmitting || loadingOptions"
        :disabled="loadingOptions || Boolean(requestError)"
        class="mt-1 justify-between sm:ml-auto sm:w-auto"
      >
        Continue to student details
        <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
      </UiButton>
    </form>
  </div>
</template>
