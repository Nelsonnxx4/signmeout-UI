<script setup lang="ts">
import type { ButtonHTMLAttributes, HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

import { buttonVariants, type ButtonVariantProps } from './buttonVariants'

interface Props {
  variant?: ButtonVariantProps['variant']
  size?: ButtonVariantProps['size']
  fullWidth?: boolean
  type?: ButtonHTMLAttributes['type']
  disabled?: boolean
  loading?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  fullWidth: false,
  type: 'button',
  disabled: false,
  loading: false,
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
    :class="
      cn(
        buttonVariants({
          variant: props.variant,
          size: props.size,
          fullWidth: props.fullWidth,
        }),
        props.class,
      )
    "
  >
    <span
      v-if="props.loading"
      aria-hidden="true"
      class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
    <slot />
  </button>
</template>
