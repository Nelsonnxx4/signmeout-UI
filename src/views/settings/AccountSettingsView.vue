<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { UiButton } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const errorMessage = ref('')
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true
  errorMessage.value = ''
  try {
    await auth.signOut()
    await router.replace('/login')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not sign out.'
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 class="text-base font-semibold text-[var(--text)]">Sign-in and security</h2>
      <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
        Sign-in uses a one-time email code or Google. Codes expire after five minutes.
      </p>
      <p class="mt-4 text-sm text-[var(--muted)]">
        Current account:
        <span class="font-semibold text-[var(--text)]">{{ auth.user?.email || 'Loading…' }}</span>
      </p>
    </div>

    <div class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 class="text-base font-semibold text-[var(--text)]">Commission policy</h2>
      <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
        SignMeOut retains 15% of each successful gift. The current policy version and acceptance
        record are stored on your account.
      </p>
    </div>

    <p v-if="errorMessage" role="alert" class="text-sm font-medium text-[var(--negative)]">
      {{ errorMessage }}
    </p>
    <UiButton variant="secondary" size="md" :loading="signingOut" @click="signOut">
      Sign out
    </UiButton>
  </section>
</template>
