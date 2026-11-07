<script setup lang="ts">
import { ArrowLeft, Check, Copy, ExternalLink, Send } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import ShirtStatusBadge from '@/components/shirts/ShirtStatusBadge.vue'
import { UiButton, buttonVariants } from '@/components/ui/button'
import { UiInput } from '@/components/ui/input'
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
const statusMessage = ref('')

const publicUrl = computed(() => {
  if (!shirt.value) return ''
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/s/${shirt.value.slug}`
})

function publishShirt() {
  if (!shirt.value || !shirts.publish(shirt.value.id)) return
  statusMessage.value = 'Shirt published in this frontend prototype.'
}

async function copyLink() {
  if (!publicUrl.value) return

  try {
    await navigator.clipboard.writeText(publicUrl.value)
    statusMessage.value = 'Public link copied.'
  } catch {
    statusMessage.value = 'Copy was blocked. Select the link and copy it manually.'
  }
}
</script>

<template>
  <section v-if="shirt && definition" class="mx-auto max-w-5xl">
    <RouterLink
      :to="`/shirts/${shirt.id}/edit`"
      class="inline-flex items-center gap-2 rounded text-sm font-semibold text-[var(--muted)] outline-none hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Back to editor
    </RouterLink>

    <header class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">
            Shirt preview
          </h1>
          <ShirtStatusBadge :status="shirt.status" />
        </div>
        <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Review the shirt as classmates will see it before you publish and share the link.
        </p>
      </div>

      <UiButton
        v-if="shirt.status === 'draft'"
        variant="primary"
        size="md"
        class="shrink-0"
        @click="publishShirt"
      >
        <Send aria-hidden="true" />
        Publish shirt
      </UiButton>
      <RouterLink
        v-else
        :to="`/s/${shirt.slug}`"
        target="_blank"
        :class="buttonVariants({ variant: 'primary', size: 'md' })"
        class="shrink-0"
      >
        View public shirt
        <ExternalLink aria-hidden="true" />
      </RouterLink>
    </header>

    <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
      <div
        class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
      >
        <div
          class="flex items-center justify-between gap-4 border-b border-[var(--border)] p-4 sm:px-5"
        >
          <p class="text-sm font-semibold text-[var(--text)]">{{ definition.name }}</p>
          <div
            class="flex rounded-[var(--radius-small)] bg-[var(--raised)] p-1"
            aria-label="Preview side"
          >
            <button
              v-for="side in ['front', 'back'] as ShirtView[]"
              :key="side"
              type="button"
              :aria-pressed="activeView === side"
              :class="[
                'h-9 rounded-md px-4 text-sm font-semibold capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]',
                activeView === side
                  ? 'bg-[var(--surface)] text-[var(--text)]'
                  : 'text-[var(--muted)]',
              ]"
              @click="activeView = side"
            >
              {{ side }}
            </button>
          </div>
        </div>
        <ShirtPreview :type="shirt.type" :view="activeView" />
      </div>

      <aside class="grid gap-5">
        <section
          class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
          aria-labelledby="public-context-heading"
        >
          <h2 id="public-context-heading" class="text-base font-semibold text-[var(--text)]">
            Public context
          </h2>
          <dl class="mt-4 grid gap-3 text-sm">
            <div>
              <dt class="text-[var(--muted)]">School</dt>
              <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.school }}</dd>
            </div>
            <div>
              <dt class="text-[var(--muted)]">Department</dt>
              <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.department }}</dd>
            </div>
            <div>
              <dt class="text-[var(--muted)]">Signing</dt>
              <dd class="mt-1 font-semibold text-[var(--text)]">0 signatures</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="shirt.status === 'published'"
          class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
          aria-labelledby="share-link-heading"
        >
          <h2 id="share-link-heading" class="text-base font-semibold text-[var(--text)]">
            Share link
          </h2>
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
            This link works in the current frontend session. Backend publishing will make it
            available across devices.
          </p>
          <UiInput
            id="public-shirt-link"
            class="mt-4"
            :model-value="publicUrl"
            readonly
            aria-label="Public shirt link"
            input-class="text-sm"
          />
          <UiButton variant="secondary" size="md" full-width class="mt-3" @click="copyLink">
            <Copy aria-hidden="true" />
            Copy link
          </UiButton>
        </section>

        <section v-else class="rounded-[var(--radius-small)] bg-[var(--brand-soft)] p-5">
          <h2 class="text-base font-semibold text-[var(--text)]">Ready to publish?</h2>
          <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
            Publishing creates the public preview link. Gifts and paid signing are the next product
            slice.
          </p>
        </section>

        <p
          v-if="statusMessage"
          class="flex items-start gap-2 text-sm font-medium text-[var(--positive)]"
          aria-live="polite"
        >
          <Check class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {{ statusMessage }}
        </p>
      </aside>
    </div>
  </section>
</template>
