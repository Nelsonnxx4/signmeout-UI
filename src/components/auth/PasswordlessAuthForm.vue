<script setup lang="ts">
import { ArrowRight, CircleCheck, Mail } from '@lucide/vue'
import { useField, useForm } from 'vee-validate'
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { z } from 'zod'

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

const emit = defineEmits<{
  submit: [payload: { email: string; intent: AuthIntent }]
}>()

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
const submittedEmail = ref('')
const successPanel = ref<HTMLElement | null>(null)

const submit = handleSubmit(async (values) => {
  submittedEmail.value = values.email.trim()
  emit('submit', { email: submittedEmail.value, intent: props.intent })
  isSent.value = true

  await nextTick()
  successPanel.value?.focus()
})

function useAnotherEmail() {
  isSent.value = false
  resent.value = false
  submittedEmail.value = ''
  resetField({ value: '' })
}

function resendLink() {
  emit('submit', { email: submittedEmail.value, intent: props.intent })
  resent.value = true
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
          :loading="isSubmitting"
          class="mt-6 justify-between"
        >
          {{ props.submitLabel }}
          <ArrowRight v-if="!isSubmitting" aria-hidden="true" />
        </UiButton>
      </form>

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
        {{ props.sentTitle }}
      </h1>
      <p class="mt-3 text-base leading-7 text-[var(--muted)]">
        {{ props.sentDescription }}
        <strong class="font-semibold text-[var(--text)]">{{ submittedEmail }}</strong>
      </p>

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <UiButton variant="primary" size="lg" @click="useAnotherEmail">
          Use another email
        </UiButton>
        <UiButton size="lg" :disabled="resent" @click="resendLink">
          {{ resent ? 'Link requested' : 'Resend link' }}
        </UiButton>
      </div>

      <p class="mt-6 text-sm leading-6 text-[var(--muted)]">
        Didn’t receive it? Check your spam folder, then resend the link.
      </p>
    </div>
  </section>
</template>
