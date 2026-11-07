import { defineStore } from 'pinia'

import { SHIRT_TYPES, type Shirt, type ShirtType } from '@/types/shirt'

const STORAGE_KEY = 'signmeout:shirt-drafts'
const MODEL_VERSION = 'shirt-glb-1.0'

interface ShirtsState {
  shirts: Shirt[]
}

function readStoredShirts(): Shirt[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as Shirt[]) : []
  } catch {
    return []
  }
}

function createId(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `${prefix}-${value}`
}

export const useShirtsStore = defineStore('shirts', {
  state: (): ShirtsState => ({
    shirts: readStoredShirts(),
  }),
  getters: {
    shirtCount: (state) => state.shirts.length,
    publishedCount: (state) => state.shirts.filter((shirt) => shirt.status === 'published').length,
    canCreate: (state) => state.shirts.length < SHIRT_TYPES.length,
    availableTypes: (state): ShirtType[] =>
      SHIRT_TYPES.filter((type) => !state.shirts.some((shirt) => shirt.type === type)),
    getById: (state) => (shirtId: string) => state.shirts.find((shirt) => shirt.id === shirtId),
    getBySlug: (state) => (slug: string) => state.shirts.find((shirt) => shirt.slug === slug),
  },
  actions: {
    persist() {
      if (typeof window === 'undefined') return
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.shirts))
    },
    createDraft(type: ShirtType) {
      if (!SHIRT_TYPES.includes(type)) {
        throw new Error('Choose a valid shirt type.')
      }

      if (this.shirts.some((shirt) => shirt.type === type)) {
        throw new Error('You already have this shirt type.')
      }

      if (!this.canCreate) {
        throw new Error('You can create up to two shirts.')
      }

      const now = new Date().toISOString()
      const shirt: Shirt = {
        id: createId('shirt'),
        type,
        slug: createId('shirt').replace(/-/g, ''),
        modelVersion: MODEL_VERSION,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      }

      this.shirts.push(shirt)
      this.persist()
      return shirt
    },
    saveDraft(shirtId: string) {
      const shirt = this.getById(shirtId)
      if (!shirt) return false

      shirt.updatedAt = new Date().toISOString()
      this.persist()
      return true
    },
    publish(shirtId: string) {
      const shirt = this.getById(shirtId)
      if (!shirt) return false

      const now = new Date().toISOString()
      shirt.status = 'published'
      shirt.updatedAt = now
      shirt.publishedAt = now
      this.persist()
      return true
    },
    reset() {
      this.shirts = []
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
