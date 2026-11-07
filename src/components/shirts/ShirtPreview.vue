<script setup lang="ts">
import { computed } from 'vue'

import { SHIRT_TYPE_DEFINITIONS, type ShirtType, type ShirtView } from '@/types/shirt'

interface Props {
  type: ShirtType
  view?: ShirtView
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  view: 'front',
  compact: false,
})

const definition = computed(() => SHIRT_TYPE_DEFINITIONS[props.type])
const accessibleLabel = computed(
  () => `${definition.value.name}, ${props.view} preview, plain pure-white garment`,
)
</script>

<template>
  <div
    data-ui="shirt-preview"
    :class="[
      'relative grid place-items-center overflow-hidden bg-[var(--brand-soft)]',
      props.compact
        ? 'min-h-36 rounded-[var(--radius-small)] p-3'
        : 'min-h-80 p-6 sm:min-h-[30rem]',
    ]"
  >
    <svg
      v-if="props.type === 'short-sleeve'"
      viewBox="0 0 260 300"
      :class="props.compact ? 'h-32 w-auto' : 'h-auto max-h-[25rem] w-full max-w-sm'"
      role="img"
      :aria-label="accessibleLabel"
    >
      <path
        d="M95 35 67 49 30 37 7 77l36 25 17-18v183h140V84l17 18 36-25-23-40-37 12-28-14c-5 19-15 29-35 29S100 54 95 35Z"
        fill="#fff"
        stroke="#aeb7b0"
        stroke-linejoin="round"
        stroke-width="3"
      />
      <path
        v-if="props.view === 'front'"
        d="M95 35c4 20 15 29 35 29s31-9 35-29"
        fill="none"
        stroke="#aeb7b0"
        stroke-linecap="round"
        stroke-width="3"
      />
      <path
        v-else
        d="M103 41c8 10 16 14 27 14s19-4 27-14"
        fill="none"
        stroke="#c5ccc6"
        stroke-linecap="round"
        stroke-width="2"
      />
      <path d="M60 84v183M200 84v183" fill="none" stroke="#e5e8e5" stroke-width="2" />
    </svg>

    <svg
      v-else
      viewBox="0 0 260 320"
      :class="props.compact ? 'h-32 w-auto' : 'h-auto max-h-[27rem] w-full max-w-sm'"
      role="img"
      :aria-label="accessibleLabel"
    >
      <path
        d="m95 37-27 15-32 57 20 159 33-5-4-70 8 101h74l8-101-4 70 33 5 20-159-32-57-27-15-35 20-35-20Z"
        fill="#fff"
        stroke="#aeb7b0"
        stroke-linejoin="round"
        stroke-width="3"
      />
      <path
        v-if="props.view === 'front'"
        d="m95 37 35 20 35-20-12 39-23-19-23 19-12-39Zm35 20v237"
        fill="#fff"
        stroke="#aeb7b0"
        stroke-linejoin="round"
        stroke-width="3"
      />
      <path
        v-else
        d="M96 39c10 15 21 22 34 22s24-7 34-22M96 76h68"
        fill="none"
        stroke="#c5ccc6"
        stroke-linecap="round"
        stroke-width="2"
      />
      <g v-if="props.view === 'front'" fill="#7c867e">
        <circle cx="130" cy="91" r="2.2" />
        <circle cx="130" cy="123" r="2.2" />
        <circle cx="130" cy="155" r="2.2" />
        <circle cx="130" cy="187" r="2.2" />
        <circle cx="130" cy="219" r="2.2" />
        <circle cx="130" cy="251" r="2.2" />
      </g>
      <path d="m56 268 33-5m115 5-33-5" fill="none" stroke="#c5ccc6" stroke-width="2" />
    </svg>

    <span
      v-if="!props.compact"
      class="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]"
    >
      {{ props.view === 'front' ? 'Front' : 'Back' }} fallback preview
    </span>
  </div>
</template>
