<script setup lang="ts">
import { ArrowLeft, ArrowRight, Eye, Save } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ShirtViewer3D from '@/components/shirts/ShirtViewer3D.vue'
import ShirtStatusBadge from '@/components/shirts/ShirtStatusBadge.vue'
import { UiButton, buttonVariants } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'
import { SHIRT_TYPE_DEFINITIONS, type ShirtView } from '@/types/shirt'

const route = useRoute()
const onboarding = useOnboardingStore()
const shirts = useShirtsStore()

const shirtId = computed(() =>
  Array.isArray(route.params.shirtId) ? route.params.shirtId[0] : route.params.shirtId,
)
const shirt = computed(() => (shirtId.value ? shirts.getById(shirtId.value) : undefined))
const definition = computed(() =>
  shirt.value ? SHIRT_TYPE_DEFINITIONS[shirt.value.type] : undefined,
)
const activeView = ref<ShirtView>('front')
const savedMessage = ref('')

async function refreshShirt() {
  if (!shirt.value) return
  try {
    if (await shirts.refreshShirt(shirt.value.id)) {
      savedMessage.value = 'Shirt details refreshed from your account.'
    }
  } catch (error) {
    savedMessage.value =
      error instanceof Error ? error.message : 'Could not refresh the shirt.'
  }
}
</script>

<template>
  <section v-if="shirt && definition">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <RouterLink
          to="/shirts"
          class="inline-flex items-center gap-2 rounded text-sm font-semibold text-[var(--muted)] outline-none hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        >
          <ArrowLeft class="size-4" aria-hidden="true" />
          Back to shirts
        </RouterLink>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
            {{ definition.name }}
          </h1>
          <ShirtStatusBadge :status="shirt.status" />
        </div>
        <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Inspect both sides of the garment before opening the public preview.
        </p>
      </div>

      <RouterLink
        :to="`/shirts/${shirt.id}/preview`"
        :class="buttonVariants({ variant: 'primary', size: 'md' })"
        class="shrink-0"
      >
        <Eye aria-hidden="true" />
        Preview shirt
      </RouterLink>
    </header>

    <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
      <div
        class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
      >
        <div class="border-b border-[var(--border)] p-4 sm:px-5">
          <p class="text-sm font-semibold text-[var(--text)]">Garment view</p>
        </div>

        <ShirtViewer3D v-model:view="activeView" :type="shirt.type" />
      </div>

      <aside class="grid gap-5">
        <section
          class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
          aria-labelledby="garment-details-heading"
        >
          <h2 id="garment-details-heading" class="text-base font-semibold text-[var(--text)]">
            Garment details
          </h2>
          <dl class="mt-4 grid gap-3 text-sm">
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[var(--muted)]">Style</dt>
              <dd class="text-right font-semibold text-[var(--text)]">
                {{ definition.shortName }}
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[var(--muted)]">Colour</dt>
              <dd class="text-right font-semibold text-[var(--text)]">Pure white</dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[var(--muted)]">School</dt>
              <dd class="max-w-44 text-right font-semibold text-[var(--text)]">
                {{ onboarding.school }}
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[var(--muted)]">Department</dt>
              <dd class="max-w-44 text-right font-semibold text-[var(--text)]">
                {{ onboarding.department }}
              </dd>
            </div>
          </dl>
        </section>

        <section
          class="rounded-[var(--radius-small)] bg-[var(--brand-soft)] p-5"
          aria-labelledby="model-heading"
        >
          <h2 id="model-heading" class="text-base font-semibold text-[var(--text)]">
            Signing surfaces
          </h2>
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
            The front, back, and both sides of each sleeve are UV-mapped for signatures. Seams,
            hems, collar details, buttons, placket, and cuffs stay protected.
          </p>
        </section>

        <div class="grid gap-3">
          <UiButton variant="secondary" size="lg" full-width @click="refreshShirt">
            <Save aria-hidden="true" />
            Refresh details
          </UiButton>
          <RouterLink
            :to="`/shirts/${shirt.id}/preview`"
            :class="buttonVariants({ variant: 'primary', size: 'lg', fullWidth: true })"
            class="justify-between"
          >
            Continue to preview
            <ArrowRight aria-hidden="true" />
          </RouterLink>
          <p
            v-if="savedMessage"
            class="text-center text-sm text-[var(--positive)]"
            aria-live="polite"
          >
            {{ savedMessage }}
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>
