<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { apiRequest } from '@/lib/api'
import { updateDisplayName } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

interface OnboardingStatus {
  profile: {
    school: { name: string; status: string }
    department: { name: string; status: string }
  } | null
  studentVerification: {
    fullName: string | null
    admissionNumber: string | null
    nickname: string | null
    status: string
  } | null
  bank: { bankName: string; accountName: string; accountNumber: string } | null
}

const auth = useAuthStore()
const onboarding = useOnboardingStore()
const details = ref<OnboardingStatus | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const name = ref(auth.user?.name ?? '')
const fullName = ref('')
const admissionNumber = ref('')
const nickname = ref('')
const savingName = ref(false)
const savingStudentDetails = ref(false)
const nameMessage = ref('')
const studentMessage = ref('')

async function saveName() {
  const nextName = name.value.trim()
  nameMessage.value = ''
  if (nextName.length < 2 || nextName.length > 80) {
    nameMessage.value = 'Enter a display name between 2 and 80 characters.'
    return
  }

  savingName.value = true
  try {
    await updateDisplayName(nextName)
    await auth.loadSession(true)
    name.value = auth.user?.name ?? nextName
    nameMessage.value = 'Display name updated.'
  } catch (error) {
    nameMessage.value = error instanceof Error ? error.message : 'Could not update your name.'
  } finally {
    savingName.value = false
  }
}

async function saveStudentDetails() {
  studentMessage.value = ''
  if (
    fullName.value.trim().length < 2 ||
    admissionNumber.value.trim().length < 3 ||
    !/^[A-Za-z0-9/-]+$/.test(admissionNumber.value.trim())
  ) {
    studentMessage.value = 'Enter a valid full name and admission number.'
    return
  }

  savingStudentDetails.value = true
  try {
    await apiRequest('/onboarding/student-verification', {
      method: 'POST',
      body: JSON.stringify({
        fullName: fullName.value.trim(),
        admissionNumber: admissionNumber.value.trim(),
        ...(nickname.value.trim() ? { nickname: nickname.value.trim() } : {}),
      }),
    })
    await onboarding.syncFromApi(true)
    details.value = await apiRequest<OnboardingStatus>('/onboarding/status')
    studentMessage.value = 'Student details updated.'
  } catch (error) {
    studentMessage.value =
      error instanceof Error ? error.message : 'Could not update your student details.'
  } finally {
    savingStudentDetails.value = false
  }
}

onMounted(async () => {
  try {
    details.value = await apiRequest<OnboardingStatus>('/onboarding/status')
    fullName.value = details.value.studentVerification?.fullName ?? ''
    admissionNumber.value = details.value.studentVerification?.admissionNumber ?? ''
    nickname.value = details.value.studentVerification?.nickname ?? ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load profile details.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="space-y-5">
    <p v-if="loading" class="text-sm text-[var(--muted)]" role="status">Loading profile…</p>
    <p v-else-if="errorMessage" class="text-sm font-medium text-[var(--negative)]" role="alert">
      {{ errorMessage }}
    </p>

    <template v-else>
      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 class="text-base font-semibold text-[var(--text)]">Account</h2>
        <form class="mt-4 grid gap-4 sm:max-w-lg" @submit.prevent="saveName">
          <FormField for="display-name" label="Display name" required>
            <UiInput id="display-name" v-model="name" autocomplete="name" maxlength="80" required />
          </FormField>
          <p class="text-sm text-[var(--muted)]">
            Email: <span class="font-semibold text-[var(--text)]">{{ auth.user?.email }}</span>
          </p>
          <p
            v-if="nameMessage"
            :class="
              nameMessage === 'Display name updated.'
                ? 'text-emerald-700'
                : 'text-[var(--negative)]'
            "
            class="text-sm"
            role="status"
          >
            {{ nameMessage }}
          </p>
          <UiButton type="submit" variant="secondary" :loading="savingName">
            Save display name
          </UiButton>
        </form>
      </div>

      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 class="text-base font-semibold text-[var(--text)]">Student profile</h2>
        <form class="mt-4 grid gap-4 sm:max-w-lg" @submit.prevent="saveStudentDetails">
          <FormField for="profile-full-name" label="Full name on school records" required>
            <UiInput
              id="profile-full-name"
              v-model="fullName"
              autocomplete="name"
              maxlength="150"
              required
            />
          </FormField>
          <FormField for="profile-admission-number" label="Admission number" required>
            <UiInput
              id="profile-admission-number"
              v-model="admissionNumber"
              autocomplete="off"
              maxlength="64"
              required
            />
          </FormField>
          <FormField for="profile-nickname" label="Nickname (optional)">
            <UiInput
              id="profile-nickname"
              v-model="nickname"
              autocomplete="nickname"
              maxlength="60"
            />
          </FormField>
          <p
            v-if="studentMessage"
            :class="
              studentMessage === 'Student details updated.'
                ? 'text-emerald-700'
                : 'text-[var(--negative)]'
            "
            class="text-sm"
            role="status"
          >
            {{ studentMessage }}
          </p>
          <UiButton type="submit" variant="secondary" :loading="savingStudentDetails">
            Save student details
          </UiButton>
        </form>
        <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-[var(--muted)]">School</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.profile?.school.name || 'Not added' }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Department</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.profile?.department.name || 'Not added' }}
            </dd>
          </div>
        </dl>
        <RouterLink
          to="/onboarding/school"
          class="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--brand-strong)] hover:underline"
        >
          Update school and department
        </RouterLink>
      </div>

      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 class="text-base font-semibold text-[var(--text)]">Payout account</h2>
        <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-[var(--muted)]">Bank</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.bank?.bankName || 'Not added' }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Account</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{
                details?.bank
                  ? `${details.bank.accountName} · ${details.bank.accountNumber}`
                  : 'Not added'
              }}
            </dd>
          </div>
        </dl>
        <RouterLink
          to="/onboarding/bank"
          class="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--brand-strong)] hover:underline"
        >
          Update payout account
        </RouterLink>
      </div>
    </template>
  </section>
</template>
