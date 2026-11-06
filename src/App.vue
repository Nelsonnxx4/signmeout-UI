<script setup lang="ts">
import { ArrowRight, Link, Mail, Search, UserPlus } from '@lucide/vue'
import { ref } from 'vue'

import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'

const email = ref('')
const emailError = ref('')
const shirtSlug = ref('nelson')
const schoolSearch = ref('')

function validateEmail() {
  emailError.value = email.value.includes('@') ? '' : 'Enter a valid email address.'
}
</script>

<template>
  <main class="min-h-screen bg-[var(--ground)] px-4 py-8 sm:px-6 sm:py-12">
    <section class="mx-auto w-full max-w-5xl">
      <header class="mb-10 flex items-center justify-between gap-4">
        <a href="/" class="inline-flex items-center gap-2.5 text-lg font-bold text-[var(--text)]">
          <span
            class="grid size-9 place-items-center rounded-[0.75rem] bg-[var(--brand)] text-sm font-extrabold text-white"
            aria-hidden="true"
          >
            S
          </span>
          SignMeOut
        </a>
        <span class="text-sm text-[var(--muted)]">UI foundation</span>
      </header>

      <div
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"
      >
        <div class="max-w-xl">
          <h1 class="text-2xl font-bold tracking-[-0.02em] text-[var(--hero-text)] sm:text-3xl">
            SignMeOut controls
          </h1>
          <p class="mt-3 text-base text-[var(--muted)]">
            The shared controls for onboarding, gifting, signing, and withdrawals.
          </p>
        </div>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <section aria-labelledby="button-heading">
            <h2 id="button-heading" class="text-base font-semibold text-[var(--text)]">Buttons</h2>
            <div class="mt-4 flex flex-wrap items-center gap-4">
              <UiButton variant="primary">
                <UserPlus aria-hidden="true" />
                Create your shirt
              </UiButton>
              <UiButton>
                <Link aria-hidden="true" />
                Copy link
              </UiButton>
              <UiButton variant="quiet">Cancel</UiButton>
              <UiButton variant="secondary" size="icon" aria-label="Continue">
                <ArrowRight aria-hidden="true" />
              </UiButton>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-4">
              <UiButton variant="primary" loading>Saving</UiButton>
              <UiButton disabled>Unavailable</UiButton>
            </div>
          </section>

          <section aria-labelledby="input-heading">
            <h2 id="input-heading" class="text-base font-semibold text-[var(--text)]">Inputs</h2>
            <form class="mt-4 grid gap-6" novalidate @submit.prevent="validateEmail">
              <FormField
                v-slot="{ messageId }"
                for="email"
                label="Email address"
                hint="We’ll use this to secure your SignMeOut account."
                :error="emailError"
                required
              >
                <UiInput
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="nelson@signmeout.ng"
                  :invalid="Boolean(emailError)"
                  :aria-describedby="messageId"
                  required
                >
                  <template #leading>
                    <Mail />
                  </template>
                </UiInput>
              </FormField>

              <FormField
                for="shirt-link"
                label="Your public link"
                hint="Share this link when your shirt is ready."
              >
                <UiInput
                  id="shirt-link"
                  v-model="shirtSlug"
                  prefix="signmeout.ng/"
                  autocomplete="off"
                />
              </FormField>

              <FormField for="school-search" label="School or organisation">
                <UiInput
                  id="school-search"
                  v-model="schoolSearch"
                  type="search"
                  placeholder="Search..."
                  autocomplete="off"
                >
                  <template #leading>
                    <Search />
                  </template>
                  <template #trailing>
                    <kbd
                      class="rounded-[var(--radius-small)] border border-[var(--control)] bg-[var(--raised)] px-2 py-1 text-xs font-semibold text-[var(--muted)]"
                    >
                      Ctrl K
                    </kbd>
                  </template>
                </UiInput>
              </FormField>

              <UiButton type="submit" variant="primary" class="justify-between sm:w-fit">
                Test validation
                <ArrowRight aria-hidden="true" />
              </UiButton>
            </form>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>
