<script setup lang="ts">
import { ArrowRight, Eye, PencilLine, Plus } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import ShirtStatusBadge from '@/components/shirts/ShirtStatusBadge.vue'
import { buttonVariants } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'
import { SHIRT_TYPE_DEFINITIONS } from '@/types/shirt'

const onboarding = useOnboardingStore()
const shirts = useShirtsStore()
</script>

<template>
  <section>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-[-0.025em] text-[var(--text)]">Dashboard</h1>
        <p class="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
          {{
            shirts.shirtCount === 0
              ? 'Both shirt slots are available. Create your first virtual signing-out shirt.'
              : `${shirts.shirtCount} of 2 shirt slots in use. Open a shirt to preview or publish it.`
          }}
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

    <dl
      class="mt-7 grid grid-cols-2 overflow-hidden rounded-[var(--radius-small)] border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-4"
    >
      <div class="border-b border-r border-[var(--border)] p-4 lg:border-b-0">
        <dt class="text-sm text-[var(--muted)]">Shirts</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">
          {{ shirts.shirtCount }} <span class="text-base font-normal text-[var(--muted)]">/ 2</span>
        </dd>
      </div>
      <div class="border-b border-[var(--border)] p-4 lg:border-b-0 lg:border-r">
        <dt class="text-sm text-[var(--muted)]">Published</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">
          {{ shirts.publishedCount }}
        </dd>
      </div>
      <div class="border-r border-[var(--border)] p-4">
        <dt class="text-sm text-[var(--muted)]">Signatures</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">0</dd>
      </div>
      <div class="p-4">
        <dt class="text-sm text-[var(--muted)]">Gross gifts</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">₦0</dd>
      </div>
    </dl>

    <div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]">
      <section
        class="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
        aria-labelledby="shirts-heading"
      >
        <div
          class="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4"
        >
          <div>
            <h2 id="shirts-heading" class="text-base font-semibold text-[var(--text)]">
              Your shirts
            </h2>
            <p class="mt-1 text-sm text-[var(--muted)]">One slot for each fixed garment type.</p>
          </div>
          <RouterLink
            to="/shirts"
            class="shrink-0 rounded text-sm font-semibold text-[var(--text)] outline-none hover:text-[var(--brand-strong)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            View all
          </RouterLink>
        </div>

        <div v-if="shirts.shirtCount" class="divide-y divide-[var(--border)]">
          <article
            v-for="shirt in shirts.shirts"
            :key="shirt.id"
            class="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center"
          >
            <ShirtPreview :type="shirt.type" compact />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="font-semibold text-[var(--text)]">
                  {{ SHIRT_TYPE_DEFINITIONS[shirt.type].name }}
                </h3>
                <ShirtStatusBadge :status="shirt.status" />
              </div>
              <p class="mt-2 text-sm leading-6 text-[var(--muted)]">
                {{ SHIRT_TYPE_DEFINITIONS[shirt.type].description }}
              </p>
              <div class="mt-4 flex flex-wrap gap-3">
                <RouterLink
                  :to="`/shirts/${shirt.id}/edit`"
                  :class="buttonVariants({ variant: 'secondary', size: 'sm' })"
                >
                  <PencilLine aria-hidden="true" />
                  Edit
                </RouterLink>
                <RouterLink
                  :to="`/shirts/${shirt.id}/preview`"
                  :class="buttonVariants({ variant: 'quiet', size: 'sm' })"
                >
                  <Eye aria-hidden="true" />
                  Preview
                </RouterLink>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-center sm:p-7"
        >
          <div>
            <h3 class="text-xl font-semibold tracking-[-0.02em] text-[var(--text)]">
              Create your first virtual shirt
            </h3>
            <p class="mt-3 max-w-lg text-base leading-7 text-[var(--muted)]">
              Pick the short-sleeve T-shirt or long-sleeve button-down. The garment stays pure white
              and unbranded, ready for classmates' signatures.
            </p>
            <RouterLink
              to="/shirts/new"
              :class="buttonVariants({ variant: 'primary', size: 'md' })"
              class="mt-5"
            >
              Choose a shirt
              <ArrowRight aria-hidden="true" />
            </RouterLink>
          </div>
          <ShirtPreview type="short-sleeve" compact />
        </div>
      </section>

      <section
        class="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
        aria-labelledby="owner-details-heading"
      >
        <h2 id="owner-details-heading" class="text-base font-semibold text-[var(--text)]">
          Owner details
        </h2>
        <dl class="mt-4 grid gap-4 text-sm">
          <div>
            <dt class="text-[var(--muted)]">School</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.school }}</dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Department</dt>
            <dd class="mt-1 font-semibold text-[var(--text)]">{{ onboarding.department }}</dd>
          </div>
          <div>
            <dt class="text-[var(--muted)]">Platform commission</dt>
            <dd class="mt-1 font-semibold tabular-nums text-[var(--text)]">10%</dd>
          </div>
        </dl>
        <RouterLink
          to="/onboarding/school"
          :class="buttonVariants({ variant: 'secondary', size: 'sm' })"
          class="mt-5"
        >
          Review setup
        </RouterLink>
      </section>
    </div>
  </section>
</template>
