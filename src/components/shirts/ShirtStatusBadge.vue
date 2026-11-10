<script setup lang="ts">
import type { ShirtStatus } from '@/types/shirt'

defineProps<{
  status: ShirtStatus
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold',
      status === 'published' || status === 'full'
        ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
        : 'bg-[var(--raised)] text-[var(--muted)]',
    ]"
  >
    {{
      status === 'published'
        ? 'Published'
        : status === 'full'
          ? 'Full'
          : status === 'archived'
            ? 'Archived'
            : 'Draft'
    }}
  </span>
</template>
