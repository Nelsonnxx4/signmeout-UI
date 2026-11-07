<script setup lang="ts">
import { Shirt } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import { cn } from '@/lib/utils'

interface Props {
  to?: string
  inverse?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  to: '/',
  inverse: false,
  class: undefined,
})
</script>

<template>
  <RouterLink
    :to="props.to"
    :class="
      cn(
        'inline-flex items-center gap-2.5 rounded-[var(--radius-small)] text-lg font-bold tracking-[-0.02em] outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
        props.inverse ? 'text-white focus-visible:ring-white/45' : 'text-[var(--text)]',
        props.class,
      )
    "
    aria-label="SignMeOut home"
  >
    <Shirt class="size-6 stroke-[1.9]" aria-hidden="true" />
    <span>SignMeOut</span>
  </RouterLink>
</template>
