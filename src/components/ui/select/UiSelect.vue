<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

interface Props {
  modelValue?: string
  invalid?: boolean
  disabled?: boolean
  class?: HTMLAttributes['class']
  selectClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  invalid: false,
  disabled: false,
  class: undefined,
  selectClass: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div
    :class="
      cn(
        'group relative flex h-16 w-full items-center rounded-[var(--radius-input)] border bg-[var(--surface)]',
        'border-[var(--control)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color] duration-100',
        !props.disabled &&
          !props.invalid &&
          'hover:border-[var(--control-hover)] focus-within:border-[var(--brand)] focus-within:ring-[3px] focus-within:ring-[var(--focus-ring)]',
        props.invalid &&
          'border-[var(--negative)] ring-[3px] ring-red-100 focus-within:border-[var(--negative)] focus-within:ring-red-100',
        props.disabled && 'cursor-not-allowed bg-[var(--raised)] opacity-65 shadow-none',
        'motion-reduce:transition-none',
        props.class,
      )
    "
  >
    <span
      v-if="$slots.leading"
      class="pointer-events-none flex shrink-0 items-center pl-4 pr-1 text-[var(--muted)] [&_svg]:size-5 [&_svg]:stroke-[1.8]"
      aria-hidden="true"
    >
      <slot name="leading" />
    </span>

    <select
      v-bind="$attrs"
      :value="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
      :class="
        cn(
          'h-full min-w-0 flex-1 appearance-none bg-transparent py-0 pr-12 text-base font-medium text-[var(--text)] outline-none',
          !$slots.leading ? 'pl-5' : 'pl-2.5',
          'disabled:cursor-not-allowed',
          props.selectClass,
        )
      "
      @change="handleChange"
    >
      <slot />
    </select>

    <ChevronDown
      class="pointer-events-none absolute right-4 size-5 stroke-[1.8] text-[var(--muted)]"
      aria-hidden="true"
    />
  </div>
</template>
