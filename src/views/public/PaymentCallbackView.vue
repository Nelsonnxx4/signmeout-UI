<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const errorMessage = ref('')

onMounted(async () => {
  const reference =
    (typeof route.query.reference === 'string' && route.query.reference) ||
    (typeof route.query.trxref === 'string' && route.query.trxref) ||
    ''

  try {
    const stored = window.sessionStorage.getItem('signmeout:pending-checkout')
    if (!stored)
      throw new Error(
        'Checkout session was not found. Return to the shirt and check payment status.',
      )
    const pending: unknown = JSON.parse(stored)
    if (
      typeof pending !== 'object' ||
      pending === null ||
      !('slug' in pending) ||
      typeof pending.slug !== 'string' ||
      !('reference' in pending) ||
      typeof pending.reference !== 'string'
    ) {
      throw new Error('Checkout session is invalid. Return to the shirt and try again.')
    }
    if (reference && reference !== pending.reference) {
      throw new Error('The payment reference does not match this checkout.')
    }

    await router.replace({
      name: 'public-shirt',
      params: { slug: pending.slug },
      query: { reference: pending.reference },
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not return from checkout.'
  }
})
</script>

<template>
  <main class="grid min-h-svh place-content-center px-5 text-center">
    <p v-if="!errorMessage" class="text-sm text-[var(--muted)]" role="status">
      Returning to the shirt to verify your payment…
    </p>
    <p v-else class="max-w-md text-sm text-[var(--negative)]" role="alert">{{ errorMessage }}</p>
  </main>
</template>
