<script setup lang="ts">
import { Eye, PencilLine, Plus } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import ShirtStatusBadge from '@/components/shirts/ShirtStatusBadge.vue'
import { buttonVariants } from '@/components/ui/button'
import { useShirtsStore } from '@/stores/shirts'
import { SHIRT_TYPES, SHIRT_TYPE_DEFINITIONS } from '@/types/shirt'

const shirts = useShirtsStore()
</script>

<template>
  <section>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">Shirts</h1>
        <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Create one short-sleeve shirt and one long-sleeve shirt. Both garments stay plain white so
          signatures remain the focus.
        </p>
      </div>

      <RouterLink
        v-if="shirts.canCreate"
        to="/shirts/new"
        :class="buttonVariants({ variant: 'primary', size: 'md' })"
        class="shrink-0"
      >
        <Plus aria-hidden="true" />
        Create shirt
      </RouterLink>
    </header>

    <div class="mt-8 grid items-start gap-5 lg:grid-cols-2">
      <article
        v-for="type in SHIRT_TYPES"
        :key="type"
        class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
      >
        <ShirtPreview :type="type" compact />

        <div class="p-5 sm:p-6">
          <template v-if="shirts.shirts.find((shirt) => shirt.type === type)">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-base font-semibold text-[var(--text)]">
                  {{ SHIRT_TYPE_DEFINITIONS[type].name }}
                </h2>
                <p class="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {{ SHIRT_TYPE_DEFINITIONS[type].description }}
                </p>
              </div>
              <ShirtStatusBadge
                :status="shirts.shirts.find((shirt) => shirt.type === type)!.status"
                class="shrink-0"
              />
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink
                :to="`/shirts/${shirts.shirts.find((shirt) => shirt.type === type)!.id}/edit`"
                :class="buttonVariants({ variant: 'primary', size: 'sm' })"
              >
                <PencilLine aria-hidden="true" />
                Open editor
              </RouterLink>
              <RouterLink
                :to="`/shirts/${shirts.shirts.find((shirt) => shirt.type === type)!.id}/preview`"
                :class="buttonVariants({ variant: 'secondary', size: 'sm' })"
              >
                <Eye aria-hidden="true" />
                Preview
              </RouterLink>
            </div>
          </template>

          <template v-else>
            <h2 class="text-base font-semibold text-[var(--text)]">
              {{ SHIRT_TYPE_DEFINITIONS[type].name }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-[var(--muted)]">
              {{ SHIRT_TYPE_DEFINITIONS[type].description }}
            </p>
            <RouterLink
              :to="{ name: 'shirt-new', query: { type } }"
              :class="buttonVariants({ variant: 'secondary', size: 'sm' })"
              class="mt-5"
            >
              <Plus aria-hidden="true" />
              Use this style
            </RouterLink>
          </template>
        </div>
      </article>
    </div>

    <p v-if="!shirts.canCreate" class="mt-6 text-sm leading-6 text-[var(--muted)]">
      Both shirt slots are in use. The MVP allows one shirt of each fixed garment type.
    </p>
  </section>
</template>
