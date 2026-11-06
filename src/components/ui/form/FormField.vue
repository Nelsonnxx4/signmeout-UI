<script setup lang="ts">
interface Props {
  for: string
  label: string
  hint?: string
  error?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hint: undefined,
  error: undefined,
  required: false,
})

const messageId = `${props.for}-message`
</script>

<template>
  <div class="grid gap-2">
    <label :for="props.for" class="text-sm font-semibold text-[var(--text)]">
      {{ props.label }}
      <span v-if="props.required" class="text-[var(--negative)]" aria-hidden="true">*</span>
    </label>

    <slot :message-id="messageId" />

    <p
      v-if="props.error"
      :id="messageId"
      role="alert"
      class="text-sm font-medium text-[var(--negative)]"
    >
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" :id="messageId" class="text-sm text-[var(--muted)]">
      {{ props.hint }}
    </p>
  </div>
</template>
