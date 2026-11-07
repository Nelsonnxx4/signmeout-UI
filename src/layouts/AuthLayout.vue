<script setup lang="ts">
import { RouterView } from 'vue-router'

import SignMeOutLogo from '@/components/SignMeOutLogo.vue'
</script>

<template>
  <div
    class="min-h-svh bg-[var(--ground)] lg:grid lg:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)]"
  >
    <aside
      class="hidden min-h-svh flex-col justify-between bg-[var(--brand)] px-10 py-9 text-white lg:flex xl:px-14 xl:py-12"
      aria-label="About SignMeOut"
    >
      <SignMeOutLogo to="/signup" inverse />

      <div class="max-w-md pb-4">
        <p class="text-sm font-semibold text-white/75">Your memories, signed</p>
        <p class="mt-4 text-[2rem] font-semibold leading-[1.12] tracking-[-0.035em]">
          Turn your signing-out shirt into something your whole class can keep adding to.
        </p>

        <ol class="mt-10 border-t border-white/25" aria-label="How SignMeOut works">
          <li class="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/25 py-4">
            <span class="text-sm font-semibold text-white/65">01</span>
            <span class="font-medium">Create your virtual shirt</span>
          </li>
          <li class="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/25 py-4">
            <span class="text-sm font-semibold text-white/65">02</span>
            <span class="font-medium">Share your unique link</span>
          </li>
          <li class="grid grid-cols-[2rem_1fr] gap-3 border-b border-white/25 py-4">
            <span class="text-sm font-semibold text-white/65">03</span>
            <span class="font-medium">Collect gifts and signatures</span>
          </li>
        </ol>
      </div>

      <p class="text-sm text-white/70">Built for the last days of school and the memories after.</p>
    </aside>

    <main class="flex min-h-svh flex-col">
      <header class="flex items-center px-5 py-5 sm:px-8 lg:hidden">
        <SignMeOutLogo to="/signup" />
      </header>

      <div class="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <RouterView />
      </div>

      <footer class="px-5 pb-6 text-center text-sm text-[var(--muted)] sm:px-8 lg:px-12">
        Secure email access. No password to remember.
      </footer>
    </main>
  </div>
</template>
