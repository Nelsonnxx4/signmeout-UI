<script setup lang="ts">
import { Cog, LayoutDashboard, ShieldCheck, Shirt as ShirtIcon, Wallet } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const route = useRoute()
const auth = useAuthStore()
const onboarding = useOnboardingStore()

const navItems = computed(() => [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shirts', label: 'Shirts', icon: ShirtIcon },
  { to: '/withdrawals', label: 'Withdraw', icon: Wallet },
  ...(auth.user?.role === 'ADMIN'
    ? [{ to: '/admin/withdrawals', label: 'Admin', icon: ShieldCheck }]
    : []),
])

const currentTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : 'SignMeOut',
)
</script>

<template>
  <div class="min-h-svh bg-[var(--dashboard-background)]">
    <aside
      class="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex"
    >
      <div class="flex h-16 shrink-0 items-center border-b border-[var(--border)] px-5">
        <SignMeOutLogo to="/dashboard" />
      </div>

      <nav class="grid gap-1 p-4" aria-label="Owner navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex h-10 items-center gap-3 rounded-[var(--radius-small)] px-3 text-sm font-medium text-[var(--muted)] outline-none transition-colors hover:bg-[var(--raised)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          active-class="!bg-[var(--brand-soft)] !font-semibold !text-[var(--text)]"
        >
          <component
            :is="item.icon"
            class="size-4.5 stroke-[1.8]"
            :class="route.path.startsWith(item.to) ? 'text-[var(--brand)]' : ''"
            aria-hidden="true"
          />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-auto border-t border-[var(--border)] p-4">
        <p class="mb-3 truncate px-1 text-xs text-[var(--muted)]">
          {{ onboarding.school || 'Owner workspace' }}
        </p>
        <RouterLink
          to="/settings/profile"
          class="flex h-10 items-center gap-3 rounded-[var(--radius-small)] px-3 text-sm font-medium text-[var(--muted)] outline-none transition-colors hover:bg-[var(--raised)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          active-class="!bg-[var(--brand-soft)] !font-semibold !text-[var(--text)]"
        >
          <Cog class="size-4.5 stroke-[1.8]" aria-hidden="true" />
          Profile & settings
        </RouterLink>
      </div>
    </aside>

    <header
      class="fixed left-0 right-0 top-0 z-10 flex h-16 items-center border-b border-[var(--border)] bg-[var(--sidebar)] md:left-60"
    >
      <div class="flex w-full items-center justify-between px-5 sm:px-8 md:px-7">
        <SignMeOutLogo to="/dashboard" class="md:hidden" />

        <div class="hidden min-w-0 md:block">
          <p class="truncate text-sm font-semibold text-[var(--text)]">
            {{ onboarding.school || 'Owner workspace' }}
          </p>
          <p v-if="onboarding.department" class="truncate text-xs text-[var(--muted)]">
            {{ onboarding.department }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <p class="truncate text-sm font-semibold text-[var(--muted)] md:text-[var(--text)]">
            {{ currentTitle }}
          </p>
          <RouterLink
            to="/settings/profile"
            class="rounded-[var(--radius-small)] p-2 text-[var(--muted)] outline-none hover:bg-[var(--raised)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] md:hidden"
            aria-label="Profile and settings"
          >
            <Cog class="size-5" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="px-5 pb-24 pt-24 sm:px-8 md:ml-60 md:px-7 md:pb-10 md:pt-24 lg:px-10">
      <div class="mx-auto w-full max-w-6xl">
        <RouterView />
      </div>
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-20 grid border-t border-[var(--border)] bg-[var(--sidebar)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      :class="auth.user?.role === 'ADMIN' ? 'grid-cols-4' : 'grid-cols-3'"
      aria-label="Owner mobile navigation"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-small)] text-xs font-medium text-[var(--muted)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        active-class="!bg-[var(--brand-soft)] !font-semibold !text-[var(--text)]"
      >
        <component
          :is="item.icon"
          class="size-5 stroke-[1.8]"
          :class="route.path.startsWith(item.to) ? 'text-[var(--brand)]' : ''"
          aria-hidden="true"
        />
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
