<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import { UiButton, buttonVariants } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'
import {
  SHIRT_TYPES,
  SHIRT_TYPE_DEFINITIONS,
  type ShirtType,
  type ShirtTypeDefinition,
} from '@/types/shirt'

const route = useRoute()
const router = useRouter()
const onboarding = useOnboardingStore()
const shirts = useShirtsStore()

const requestedType = Array.isArray(route.query.type) ? route.query.type[0] : route.query.type
const validRequestedType = SHIRT_TYPES.includes(requestedType as ShirtType)
  ? (requestedType as ShirtType)
  : undefined

const selectedType = ref<ShirtType | ''>(
  validRequestedType && shirts.availableTypes.includes(validRequestedType)
    ? validRequestedType
    : '',
)
const error = ref('')

const choices = computed<ShirtTypeDefinition[]>(() =>
  SHIRT_TYPES.map((type) => SHIRT_TYPE_DEFINITIONS[type]),
)

async function createShirt() {
  if (!selectedType.value) {
    error.value = 'Choose a shirt style to continue.'
    return
  }

  try {
    const shirt = shirts.createDraft(selectedType.value)
    error.value = ''
    await router.push(`/shirts/${shirt.id}/edit`)
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not create the shirt.'
  }
}
</script>

<template>
  <section class="mx-auto max-w-5xl">
    <RouterLink
      to="/shirts"
      class="inline-flex items-center gap-2 rounded text-sm font-semibold text-[var(--muted)] outline-none hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Back to shirts
    </RouterLink>

    <div class="mt-6">
      <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">Create shirt</h1>
      <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
        Choose one of the two fixed signing-out garments. Colour and fit stay unchanged; classmates'
        signatures will make the shirt yours.
      </p>
    </div>

    <form class="mt-8" novalidate @submit.prevent="createShirt">
      <fieldset :aria-describedby="error ? 'shirt-type-error' : 'shirt-type-help'">
        <legend class="text-base font-semibold text-[var(--text)]">Choose a garment</legend>
        <p id="shirt-type-help" class="mt-1 text-sm leading-6 text-[var(--muted)]">
          You can create one of each type. A style already in use cannot be selected again.
        </p>

        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <label
            v-for="choice in choices"
            :key="choice.type"
            :class="[
              'relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] outline-none transition-[border-color,box-shadow]',
              selectedType === choice.type
                ? 'border-[var(--brand)] ring-[3px] ring-[var(--focus-ring)]'
                : 'border-[var(--border)]',
              !shirts.availableTypes.includes(choice.type)
                ? 'cursor-not-allowed opacity-55'
                : 'cursor-pointer hover:border-[var(--control-hover)]',
            ]"
          >
            <input
              v-model="selectedType"
              class="absolute right-4 top-4 z-10 size-5 cursor-pointer accent-[var(--brand)] disabled:cursor-not-allowed"
              type="radio"
              name="shirt-type"
              :value="choice.type"
              :disabled="!shirts.availableTypes.includes(choice.type)"
              @change="error = ''"
            />
            <ShirtPreview :type="choice.type" compact />
            <span class="block p-5">
              <span class="text-base font-semibold text-[var(--text)]">{{ choice.name }}</span>
              <span class="mt-1 block text-sm leading-6 text-[var(--muted)]">
                {{ choice.description }}
              </span>
              <span
                v-if="!shirts.availableTypes.includes(choice.type)"
                class="mt-3 block text-sm font-semibold text-[var(--text)]"
              >
                Already created
              </span>
            </span>
          </label>
        </div>

        <p
          v-if="error"
          id="shirt-type-error"
          role="alert"
          class="mt-3 text-sm font-medium text-[var(--negative)]"
        >
          {{ error }}
        </p>
      </fieldset>

      <section
        class="mt-6 rounded-[var(--radius-small)] bg-[var(--raised)] p-5"
        aria-labelledby="shirt-context-heading"
      >
        <h2 id="shirt-context-heading" class="text-base font-semibold text-[var(--text)]">
          Public shirt details
        </h2>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-[var(--muted)]">School</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.school }}</dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Department</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.department }}</dd>
          </div>
        </dl>
      </section>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <RouterLink to="/shirts" :class="buttonVariants({ variant: 'secondary', size: 'lg' })">
          Cancel
        </RouterLink>
        <UiButton type="submit" variant="primary" size="lg" class="justify-between">
          Create draft
          <ArrowRight aria-hidden="true" />
        </UiButton>
      </div>
    </form>
  </section>
</template>
