import { defineStore } from 'pinia'

import { getAuthSession, signOut as requestSignOut, type AuthSession } from '@/lib/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as AuthSession | null,
    loaded: false,
    loading: false,
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.session?.user),
    user: (state) => state.session?.user ?? null,
  },
  actions: {
    async loadSession(force = false) {
      if (this.loaded && !force) return this.session
      if (this.loading) return this.session

      this.loading = true
      this.error = ''
      try {
        this.session = await getAuthSession()
        this.loaded = true
        return this.session
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Could not load your sign-in session.'
        throw error
      } finally {
        this.loading = false
      }
    },
    async signOut() {
      await requestSignOut()
      this.session = null
      this.loaded = true
    },
  },
})
