<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { apiRequest } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

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
const details = ref<OnboardingStatus | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    details.value = await apiRequest<OnboardingStatus>('/onboarding/status')
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
        <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-[var(--muted)]">Full name</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ auth.user?.name || 'Not set' }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Email</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ auth.user?.email || 'Not set' }}
            </dd>
          </div>
        </dl>
      </div>

      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 class="text-base font-semibold text-[var(--text)]">Student profile</h2>
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
          <div>
            <dt class="text-[var(--muted)]">Full name on school records</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.studentVerification?.fullName || 'Not added' }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Admission number</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.studentVerification?.admissionNumber || 'Not added' }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Nickname</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">
              {{ details?.studentVerification?.nickname || 'Not added' }}
            </dd>
          </div>
        </dl>
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
      </div>
    </template>
  </section>
</template>
