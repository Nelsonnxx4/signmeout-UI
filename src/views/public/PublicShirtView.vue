<script setup lang="ts">
import { Gift } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
import ShirtViewer3D from '@/components/shirts/ShirtViewer3D.vue'
import { UiButton } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { UiInput } from '@/components/ui/input'
import { UiSelect } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { SHIRT_TYPE_DEFINITIONS, type ShirtType, type ShirtView } from '@/types/shirt'

interface PublicShirt {
  slug: string
  shirtType: 'SHORT_SLEEVE' | 'LONG_SLEEVE'
  ownerName: string
  school: string | null
  model: { version: number; key: string }
  status: string
  signingAvailable: boolean
  placementConfig?: { version: number; surfaces: { id: string }[] } | null
}

interface PublicSignature {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  scale: number
  submittedAt: string
  assetUrl: string
}

interface PaymentStatus {
  status: string
  signing: { accessToken: string; status: string } | null
}

interface CheckoutResult {
  payment: { reference: string; grossAmountKobo: number }
  authorizationUrl: string
}

const route = useRoute()
const slug = computed(() =>
  Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug,
)
const shirt = ref<PublicShirt | null>(null)
const signatures = ref<PublicSignature[]>([])
const signatureCount = computed(() => signatures.value.length)
const activeView = ref<ShirtView>('front')
const giftAmountNaira = ref<number | ''>(2000)
const signatureSize = ref('1')
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const paymentMessage = ref('')
const paymentComplete = ref(false)
const definition = computed(() => {
  if (!shirt.value) return undefined
  return SHIRT_TYPE_DEFINITIONS[
    shirt.value.shirtType === 'SHORT_SLEEVE' ? 'short-sleeve' : 'long-sleeve'
  ]
})
const validSizes = computed(() =>
  typeof giftAmountNaira.value === 'number' && giftAmountNaira.value >= 5000
    ? ['1', '2', '3', '4']
    : ['1'],
)
const hasPlacementConfig = computed(() => Boolean(shirt.value?.placementConfig?.surfaces.length))
const totalNaira = computed(() => {
  const gift = typeof giftAmountNaira.value === 'number' ? giftAmountNaira.value : 0
  const fee = { '1': 0, '2': 500, '3': 700, '4': 1000 }[signatureSize.value] ?? 0
  return gift + fee
})
const canCheckout = computed(
  () =>
    typeof giftAmountNaira.value === 'number' &&
    Number.isSafeInteger(giftAmountNaira.value * 100) &&
    giftAmountNaira.value >= 2000 &&
    giftAmountNaira.value <= 21_473_836,
)

watch(giftAmountNaira, (amount) => {
  if (typeof amount !== 'number' || amount < 5000) signatureSize.value = '1'
})

async function loadShirt() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (!slug.value) throw new Error('This shirt link is incomplete.')
    const [publicShirt, publicSignatures] = await Promise.all([
      apiRequest<PublicShirt>(`/public/shirts/${encodeURIComponent(slug.value)}`),
      apiRequest<PublicSignature[]>(`/public/shirts/${encodeURIComponent(slug.value)}/signatures`),
    ])
    shirt.value = publicShirt
    signatures.value = publicSignatures
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not load this shirt.'
  } finally {
    loading.value = false
  }
}

async function checkPayment(reference: string) {
  paymentMessage.value = ''
  errorMessage.value = ''
  try {
    const result = await apiRequest<PaymentStatus>(
      `/payments/${encodeURIComponent(reference)}/status`,
    )
    if (result.status === 'PAID') {
      paymentComplete.value = true
      paymentMessage.value = result.signing
        ? 'Payment confirmed. Signing placement is temporarily unavailable until this shirt model has an approved placement setup.'
        : 'Payment is confirmed, but signing authorization is not available. Contact SignMeOut support before attempting another payment.'
      return
    }
    paymentMessage.value =
      result.status === 'PENDING'
        ? 'Payment is still being confirmed. Refresh this page in a moment.'
        : `Payment status: ${result.status.toLowerCase()}.`
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not verify the payment status.'
  }
}

async function checkout() {
  if (!shirt.value || typeof giftAmountNaira.value !== 'number') return
  submitting.value = true
  errorMessage.value = ''
  paymentMessage.value = ''
  try {
    const result = await apiRequest<CheckoutResult>(
      `/public/shirts/${encodeURIComponent(shirt.value.slug)}/checkout`,
      {
        method: 'POST',
        body: JSON.stringify({
          giftAmountKobo: Math.round(giftAmountNaira.value * 100),
          signatureSize: Number(signatureSize.value),
        }),
      },
    )
    window.sessionStorage.setItem(
      'signmeout:pending-checkout',
      JSON.stringify({ slug: shirt.value.slug, reference: result.payment.reference }),
    )
    window.location.assign(result.authorizationUrl)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not start checkout.'
    submitting.value = false
  }
}

onMounted(async () => {
  await loadShirt()
  const reference = typeof route.query.reference === 'string' ? route.query.reference : ''
  if (reference) {
    await checkPayment(reference)
    window.sessionStorage.removeItem('signmeout:pending-checkout')
  }
})
</script>

<template>
  <div class="min-h-svh bg-[var(--ground)]">
    <header class="border-b border-[var(--border)] bg-[var(--surface)]">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <SignMeOutLogo to="/" />
        <span class="text-sm font-semibold text-[var(--muted)]">Public shirt</span>
      </div>
    </header>

    <main
      v-if="loading"
      class="mx-auto max-w-6xl px-5 py-12 text-sm text-[var(--muted)]"
      role="status"
    >
      Loading shirt…
    </main>
    <main v-else-if="shirt && definition" class="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section>
          <div
            class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
          >
            <div class="border-b border-[var(--border)] p-4 sm:px-5">
              <p class="text-sm font-semibold text-[var(--text)]">{{ definition.name }}</p>
            </div>
            <ShirtViewer3D
              v-model:view="activeView"
              :type="shirt.shirtType === 'SHORT_SLEEVE' ? 'short-sleeve' : 'long-sleeve'"
            />
          </div>

          <section
            class="mt-5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 class="font-semibold text-[var(--text)]">Signatures ({{ signatureCount }})</h2>
            <p v-if="!signatures.length" class="mt-2 text-sm text-[var(--muted)]">
              No signatures yet. Be the first to leave a mark.
            </p>
            <ul v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <li
                v-for="signature in signatures"
                :key="signature.id"
                class="rounded border border-[var(--border)] p-2"
              >
                <img
                  :src="signature.assetUrl"
                  alt="Contributor signature"
                  class="h-20 w-full object-contain"
                  loading="lazy"
                />
                <p class="mt-1 truncate text-xs text-[var(--muted)]">
                  Signed {{ new Date(signature.submittedAt).toLocaleDateString('en-NG') }}
                </p>
              </li>
            </ul>
          </section>
        </section>

        <section class="pt-1 lg:sticky lg:top-8">
          <p class="text-sm font-semibold text-[var(--hero-text)]">Signing-out shirt</p>
          <h1
            class="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--text)] sm:text-4xl"
          >
            Leave your mark on {{ shirt.ownerName }}’s shirt
          </h1>
          <p class="mt-4 text-base leading-7 text-[var(--muted)]">
            {{ shirt.school || 'SignMeOut' }} · {{ definition.shortName }}
          </p>

          <dl
            class="mt-7 grid grid-cols-2 gap-3 rounded-[var(--radius-small)] bg-[var(--raised)] p-4 text-sm"
          >
            <div>
              <dt class="text-[var(--muted)]">Minimum gift</dt>
              <dd class="mt-1 font-semibold tabular-nums text-[var(--text)]">₦2,000</dd>
            </div>
            <div>
              <dt class="text-[var(--muted)]">Signatures</dt>
              <dd class="mt-1 font-semibold tabular-nums text-[var(--text)]">
                {{ signatureCount }}
              </dd>
            </div>
          </dl>

          <div
            v-if="paymentComplete"
            class="mt-6 rounded-[var(--radius-small)] bg-[var(--brand-soft)] p-4 text-sm leading-6 text-[var(--text)]"
            role="status"
          >
            {{ paymentMessage }}
          </div>
          <form v-else class="mt-6 grid gap-4" @submit.prevent="checkout">
            <FormField
              for="gift-amount"
              label="Gift amount (₦)"
              hint="Minimum gift is ₦2,000."
              required
            >
              <UiInput
                id="gift-amount"
                v-model.number="giftAmountNaira"
                type="number"
                min="2000"
                max="21473836"
                step="100"
                inputmode="numeric"
              />
            </FormField>
            <FormField for="signature-size" label="Signature size">
              <UiSelect id="signature-size" v-model="signatureSize">
                <option v-for="size in validSizes" :key="size" :value="size">{{ size }}×</option>
              </UiSelect>
            </FormField>
            <p class="text-sm text-[var(--muted)]">
              Checkout total:
              <strong class="text-[var(--text)]">₦{{ totalNaira.toLocaleString('en-NG') }}</strong>
            </p>
            <p class="text-xs leading-5 text-[var(--muted)]">
              The final amount and 15% allocation are calculated by the server.
            </p>
            <UiButton
              type="submit"
              variant="primary"
              size="lg"
              full-width
              :loading="submitting"
              :disabled="!shirt.signingAvailable || !hasPlacementConfig || !canCheckout"
            >
              <Gift aria-hidden="true" />
              Continue to secure checkout
            </UiButton>
          </form>

          <p
            v-if="shirt.signingAvailable && !hasPlacementConfig"
            class="mt-4 rounded-[var(--radius-small)] border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
            role="status"
          >
            Checkout is temporarily unavailable because this shirt has no approved signing placement
            configuration yet.
          </p>

          <p
            v-if="paymentMessage && !paymentComplete"
            role="status"
            class="mt-4 text-sm text-[var(--muted)]"
          >
            {{ paymentMessage }}
          </p>
          <p
            v-if="errorMessage"
            role="alert"
            class="mt-4 text-sm font-medium text-[var(--negative)]"
          >
            {{ errorMessage }}
          </p>
          <p v-if="!shirt.signingAvailable" class="mt-4 text-sm text-[var(--muted)]">
            This shirt is not accepting signatures right now.
          </p>
        </section>
      </div>
    </main>

    <main
      v-else
      class="mx-auto grid min-h-[calc(100svh-4rem)] max-w-lg place-content-center px-5 py-12 text-center"
    >
      <h1 class="text-2xl font-semibold text-[var(--text)]">Shirt not available</h1>
      <p class="mt-3 leading-7 text-[var(--muted)]">
        {{ errorMessage || 'This shirt could not be found.' }}
      </p>
      <RouterLink to="/" class="mt-6 font-semibold text-[var(--brand-strong)]"
        >Go to SignMeOut</RouterLink
      >
    </main>
  </div>
</template>
