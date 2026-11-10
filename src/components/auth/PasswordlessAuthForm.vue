<script setup lang="ts">
import { ArrowRight, CircleCheck, Mail } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { nextTick, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'

import { sendSignInCode, signInWithGoogle, verifySignInCode } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth'
import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'

export type AuthIntent = 'signup' | 'login' | 'recovery'

interface Props {
  intent: AuthIntent
  eyebrow: string
  title: string
  description: string
  submitLabel: string
  sentTitle: string
  sentDescription: string
  alternateText: string
  alternateLabel: string
  alternateTo: string
  recoveryTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  recoveryTo: undefined,
})

const router = useRouter()
const auth = useAuthStore()

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.')

const { handleSubmit, isSubmitting } = useForm<{ email: string }>({
  initialValues: { email: '' },
})

const {
  value: email,
  errorMessage,
  handleBlur,
  resetField,
} = useField<string>(
  'email',
  (value) => {
    const result = emailSchema.safeParse(value)
    return result.success || result.error.issues[0]?.message || 'Enter a valid email address.'
  },
  { validateOnValueUpdate: false },
)

const isSent = ref(false)
const resent = ref(false)
const isVerified = ref(false)
const submittedEmail = ref('')
const otp = ref('')
const requestError = ref('')
const isSending = ref(false)
const isVerifying = ref(false)
const successPanel = ref<HTMLElement | null>(null)

const submit = handleSubmit(async (values) => {
  submittedEmail.value = values.email.trim()
  requestError.value = ''
  isSending.value = true
  try {
    await sendSignInCode(submittedEmail.value)
    isSent.value = true
  } catch (error) {
    requestError.value =
      error instanceof Error ? error.message : 'Could not send your sign-in code.'
  } finally {
    isSending.value = false
  }

  await nextTick()
  successPanel.value?.focus()
})

async function verifyCode() {
  requestError.value = ''
  if (!/^\d{6}$/.test(otp.value)) {
    requestError.value = 'Enter the 6-digit code from your email.'
    return
  }

  isVerifying.value = true
  try {
    await verifySignInCode(submittedEmail.value, otp.value)
    await auth.loadSession(true)
    isVerified.value = true
    await router.replace('/dashboard')
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not verify the code.'
  } finally {
    isVerifying.value = false
  }
}

function useAnotherEmail() {
  isSent.value = false
  resent.value = false
  isVerified.value = false
  submittedEmail.value = ''
  otp.value = ''
  requestError.value = ''
  resetField({ value: '' })
}

async function resendLink() {
  requestError.value = ''
  try {
    await sendSignInCode(submittedEmail.value)
    resent.value = true
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not resend your code.'
  }
}

async function googleSignIn() {
  requestError.value = ''
  try {
    await signInWithGoogle(`${window.location.origin}/dashboard`)
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Could not start Google sign-in.'
  }
}
</script>

<template>
  <section class="w-full max-w-[31rem]" aria-live="polite">
    <div v-if="!isSent">
      <p class="text-sm font-semibold text-[var(--hero-text)]">{{ props.eyebrow }}</p>
      <h1
        class="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-[var(--text)]"
      >
        {{ props.title }}
      </h1>
      <p class="mt-3 max-w-md text-base leading-7 text-[var(--muted)]">
        {{ props.description }}
      </p>

      <form class="mt-8" novalidate @submit="submit">
        <FormField
          v-slot="{ messageId }"
          for="email"
          label="Email address"
          hint="We’ll only use this email to secure your account and send account updates."
          :error="errorMessage"
          required
        >
          <UiInput
            id="email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            inputmode="email"
            placeholder="nelson@unilag.edu.ng"
            :invalid="Boolean(errorMessage)"
            :aria-describedby="messageId"
            required
            @blur="handleBlur($event, true)"
          >
            <template #leading>
              <Mail />
            </template>
          </UiInput>
        </FormField>

        <div v-if="props.recoveryTo" class="mt-3 text-right">
          <RouterLink
            :to="props.recoveryTo"
            class="rounded text-sm font-semibold text-[var(--text)] underline decoration-[var(--control)] underline-offset-4 outline-none hover:decoration-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            Can’t access your account?
          </RouterLink>
        </div>

        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="isSubmitting || isSending"
          class="mt-6 justify-between"
        >
          Email me a verification code
          <ArrowRight v-if="!isSubmitting && !isSending" aria-hidden="true" />
        </UiButton>
      </form>

      <div class="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span class="h-px flex-1 bg-[var(--border)]" />
        or
        <span class="h-px flex-1 bg-[var(--border)]" />
      </div>
      <UiButton size="lg" full-width @click="googleSignIn">Continue with Google</UiButton>

      <p v-if="requestError" role="alert" class="mt-4 text-sm font-medium text-[var(--negative)]">
        {{ requestError }}
      </p>

      <p class="mt-8 text-center text-sm text-[var(--muted)]">
        {{ props.alternateText }}
        <RouterLink
          :to="props.alternateTo"
          class="ml-1 rounded font-semibold text-[var(--text)] underline decoration-[var(--control)] underline-offset-4 outline-none hover:decoration-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        >
          {{ props.alternateLabel }}
        </RouterLink>
      </p>
    </div>

    <div v-else ref="successPanel" tabindex="-1" class="outline-none">
      <CircleCheck class="size-8 stroke-[1.8] text-[var(--brand)]" aria-hidden="true" />
      <h1
        class="mt-5 text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-[var(--text)]"
      >
        {{ isVerified ? 'You’re signed in' : props.sentTitle }}
      </h1>
      <p class="mt-3 text-base leading-7 text-[var(--muted)]">
        <template v-if="!isVerified">
          {{ props.sentDescription }}
          <strong class="font-semibold text-[var(--text)]">{{ submittedEmail }}</strong>
        </template>
        <template v-else>Taking you to your workspace…</template>
      </p>

      <form v-if="!isVerified" class="mt-8 grid gap-4" @submit.prevent="verifyCode">
        <FormField
          v-slot="{ messageId }"
          for="verification-code"
          label="Verification code"
          hint="Enter the 6-digit code. It expires in 5 minutes."
          required
        >
          <UiInput
            id="verification-code"
            v-model="otp"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            :aria-describedby="messageId"
          />
        </FormField>
        <p v-if="requestError" role="alert" class="text-sm font-medium text-[var(--negative)]">
          {{ requestError }}
        </p>
        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="isVerifying"
          class="justify-between"
        >
          Verify and sign in
          <ArrowRight v-if="!isVerifying" aria-hidden="true" />
        </UiButton>
        <div class="grid gap-3 sm:grid-cols-2">
          <UiButton type="button" size="lg" @click="useAnotherEmail">Use another email</UiButton>
          <UiButton type="button" size="lg" :disabled="resent" @click="resendLink">
            {{ resent ? 'Code sent' : 'Resend code' }}
          </UiButton>
        </div>
      </form>

      <p v-if="!isVerified" class="mt-6 text-sm leading-6 text-[var(--muted)]">
        Didn’t receive it? Check your spam folder, then resend the code.
      </p>
    </div>
  </section>
</template>
