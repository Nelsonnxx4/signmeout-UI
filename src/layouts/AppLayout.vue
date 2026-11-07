<script setup lang="ts">
import { LayoutDashboard } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
</script>

<template>
  <div class="min-h-svh bg-[var(--dashboard-background)]">
    <header
      class="sticky top-0 z-10 flex h-16 items-center border-b border-[var(--border)] bg-[var(--sidebar)] px-5 md:hidden"
    >
      <SignMeOutLogo to="/dashboard" />
    </header>

    <aside
      class="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] p-5 md:flex"
    >
      <SignMeOutLogo to="/dashboard" class="mt-1" />

      <nav class="mt-10" aria-label="Owner navigation">
        <RouterLink
          to="/dashboard"
          class="flex h-11 items-center gap-3 rounded-[var(--radius-small)] bg-[var(--raised)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          aria-current="page"
        >
          <LayoutDashboard class="size-4.5 stroke-[1.8] text-[var(--muted)]" aria-hidden="true" />
          Dashboard
        </RouterLink>
      </nav>

      <div class="mt-auto border-t border-[var(--border)] pt-4">
        <p class="text-sm font-semibold text-[var(--text)]">Shirt owner</p>
        <p class="mt-1 text-xs text-[var(--muted)]">Account email appears here</p>
      </div>
    </aside>

    <main class="px-5 py-8 sm:px-8 md:ml-60 md:px-10 md:py-10">
      <div class="mx-auto w-full max-w-6xl">
        <RouterView />
      </div>
    </main>
  </div>
</template>
