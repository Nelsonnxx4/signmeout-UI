<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

interface Props {
  modelValue?: string | number
  type?: InputHTMLAttributes['type']
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
  prefix?: string
  suffix?: string
  class?: HTMLAttributes['class']
  inputClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  invalid: false,
  disabled: false,
  readonly: false,
  prefix: undefined,
  suffix: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    :class="
      cn(
        'group flex h-16 w-full items-center overflow-hidden rounded-[var(--radius-input)] border bg-[var(--surface)]',
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
      class="flex shrink-0 items-center pl-4 pr-1 text-[var(--muted)] [&_svg]:size-5 [&_svg]:stroke-[1.8]"
      aria-hidden="true"
    >
      <slot name="leading" />
    </span>

    <span v-if="props.prefix" class="shrink-0 pl-5 pr-1 text-base font-semibold text-[var(--text)]">
      {{ props.prefix }}
    </span>

    <input
      v-bind="$attrs"
      :value="props.modelValue"
      :type="props.type"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :aria-invalid="props.invalid || undefined"
      :class="
        cn(
          'h-full min-w-0 flex-1 bg-transparent py-0 text-base font-medium text-[var(--text)] outline-none',
          'placeholder:font-normal placeholder:text-[var(--faint)]',
          !$slots.leading && !props.prefix ? 'pl-5' : 'pl-2.5',
          !$slots.trailing && !props.suffix ? 'pr-5' : 'pr-2.5',
          'disabled:cursor-not-allowed',
          props.inputClass,
        )
      "
      @input="handleInput"
    />

    <span v-if="props.suffix" class="shrink-0 pl-1 pr-5 text-base font-semibold text-[var(--text)]">
      {{ props.suffix }}
    </span>

    <span
      v-if="$slots.trailing"
      class="flex shrink-0 items-center pl-1 pr-2.5 text-[var(--muted)] [&_svg]:size-5 [&_svg]:stroke-[1.8]"
    >
      <slot name="trailing" />
    </span>
  </div>
</template>
