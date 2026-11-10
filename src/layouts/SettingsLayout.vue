<script setup lang="ts">
import { Cog, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const secondaryNav = [
  { to: '/settings/profile', label: 'Profile', icon: UserRound },
  { to: '/settings/preferences', label: 'Settings', icon: Cog },
]

const currentTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : 'Settings',
)
</script>

<template>
  <div
    class="min-h-[calc(100vh-7rem)] rounded-[var(--radius-large)] border border-[var(--border)] bg-[var(--sidebar)] shadow-sm"
  >
    <div class="flex min-h-full flex-col md:flex-row">
      <aside
        class="w-full border-b border-[var(--border)] bg-[var(--raised)] p-4 md:w-64 md:border-b-0 md:border-r"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Settings
        </p>

        <nav class="grid gap-1" aria-label="Account settings navigation">
          <RouterLink
            v-for="item in secondaryNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-[var(--radius-small)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--text)]"
            active-class="!bg-[var(--brand-soft)] !font-semibold !text-[var(--text)]"
          >
            <component :is="item.icon" class="size-4 stroke-[1.8]" aria-hidden="true" />
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <div class="flex-1 p-5 sm:p-6 lg:p-8">
        <div
          class="mb-6 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Workspace
            </p>
            <h1 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              {{ currentTitle }}
            </h1>
          </div>
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>
