<script setup lang="ts">
import { ArrowLeftRight, Gift, PenLine } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import { UiButton, buttonVariants } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'
import { SHIRT_TYPE_DEFINITIONS, type ShirtView } from '@/types/shirt'

const route = useRoute()
const onboarding = useOnboardingStore()
const shirts = useShirtsStore()

const slug = computed(() =>
  Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug,
)
const shirt = computed(() => (slug.value ? shirts.getBySlug(slug.value) : undefined))
const publishedShirt = computed(() =>
  shirt.value?.status === 'published' ? shirt.value : undefined,
)
const definition = computed(() =>
  publishedShirt.value ? SHIRT_TYPE_DEFINITIONS[publishedShirt.value.type] : undefined,
)
const activeView = ref<ShirtView>('front')
</script>

<template>
  <div class="min-h-svh bg-[var(--ground)]">
    <header class="border-b border-[var(--border)] bg-[var(--surface)]">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <SignMeOutLogo to="/" />
        <span class="text-sm font-semibold text-[var(--muted)]">Public shirt</span>
      </div>
    </header>

    <main v-if="publishedShirt && definition" class="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section
          class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
        >
          <div
            class="flex items-center justify-between gap-4 border-b border-[var(--border)] p-4 sm:px-5"
          >
            <p class="text-sm font-semibold text-[var(--text)]">{{ definition.name }}</p>
            <button
              type="button"
              class="inline-flex h-10 items-center gap-2 rounded-[var(--radius-small)] px-3 text-sm font-semibold text-[var(--text)] outline-none hover:bg-[var(--raised)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              @click="activeView = activeView === 'front' ? 'back' : 'front'"
            >
              <ArrowLeftRight class="size-4" aria-hidden="true" />
              Show {{ activeView === 'front' ? 'back' : 'front' }}
            </button>
          </div>
          <ShirtPreview :type="publishedShirt.type" :view="activeView" />
        </section>

        <section class="pt-1 lg:sticky lg:top-8">
          <p class="text-sm font-semibold text-[var(--hero-text)]">Signing-out shirt</p>
          <h1
            class="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--text)] sm:text-4xl"
          >
            Leave your mark on this shirt
          </h1>
          <p class="mt-4 text-base leading-7 text-[var(--muted)]">
            {{ onboarding.department }} at {{ onboarding.school }}. Send a gift and add your
            signature when paid signing is connected.
          </p>

          <dl
            class="mt-7 grid grid-cols-2 gap-3 rounded-[var(--radius-small)] bg-[var(--raised)] p-4 text-sm"
          >
            <div>
              <dt class="text-[var(--muted)]">Minimum gift</dt>
              <dd class="mt-1 font-semibold tabular-nums text-[var(--text)]">₦2,000</dd>
            </div>
            <div>
              <dt class="text-[var(--muted)]">Signatures</dt>
              <dd class="mt-1 font-semibold tabular-nums text-[var(--text)]">0</dd>
            </div>
          </dl>

          <UiButton variant="primary" size="lg" full-width class="mt-6" disabled>
            <Gift aria-hidden="true" />
            Gift and sign
          </UiButton>
          <p class="mt-3 flex items-start gap-2 text-sm leading-6 text-[var(--muted)]">
            <PenLine class="mt-1 size-4 shrink-0" aria-hidden="true" />
            Checkout and signature placement are not connected in this frontend milestone yet.
          </p>
        </section>
      </div>
    </main>

    <main
      v-else
      class="mx-auto grid min-h-[calc(100svh-4rem)] max-w-lg place-content-center px-5 py-12 text-center"
    >
      <h1 class="text-2xl font-semibold text-[var(--text)]">Shirt not available</h1>
      <p class="mt-3 leading-7 text-[var(--muted)]">
        This preview may be unpublished or stored in a different browser session.
      </p>
      <RouterLink
        to="/"
        :class="buttonVariants({ variant: 'primary', size: 'md' })"
        class="mx-auto mt-6"
      >
        Go to SignMeOut
      </RouterLink>
    </main>
  </div>
</template>
