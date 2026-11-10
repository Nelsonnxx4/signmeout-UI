import { defineStore } from 'pinia'

import { apiRequest } from '@/lib/api'
import { SHIRT_TYPES, type Shirt, type ShirtType } from '@/types/shirt'

interface ShirtsState {
  shirts: Shirt[]
  loaded: boolean
  loading: boolean
  error: string
}

interface ApiShirt {
  id: string
  shirtType: 'SHORT_SLEEVE' | 'LONG_SLEEVE'
  slug: string
  status: 'ACTIVE' | 'PAUSED' | 'FULL' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  modelVersion: { version: number; modelKey: string }
  shareUrl: string
}

function mapShirt(shirt: ApiShirt): Shirt {
  return {
    id: shirt.id,
    type: shirt.shirtType === 'SHORT_SLEEVE' ? 'short-sleeve' : 'long-sleeve',
    slug: shirt.slug,
    modelVersion: `shirt-glb-${shirt.modelVersion.version}`,
    status:
      shirt.status === 'ACTIVE'
        ? 'published'
        : shirt.status === 'FULL'
          ? 'full'
          : shirt.status === 'ARCHIVED'
            ? 'archived'
            : 'draft',
    createdAt: shirt.createdAt,
    updatedAt: shirt.updatedAt,
    publishedAt: shirt.status === 'ACTIVE' || shirt.status === 'FULL' ? shirt.updatedAt : null,
    shareUrl: shirt.shareUrl,
  }
}

export const useShirtsStore = defineStore('shirts', {
  state: (): ShirtsState => ({
    shirts: [],
    loaded: false,
    loading: false,
    error: '',
  }),
  getters: {
    shirtCount: (state) => state.shirts.length,
    publishedCount: (state) =>
      state.shirts.filter((shirt) => shirt.status === 'published' || shirt.status === 'full')
        .length,
    canCreate: (state) => state.shirts.length < SHIRT_TYPES.length,
    availableTypes: (state): ShirtType[] =>
      SHIRT_TYPES.filter((type) => !state.shirts.some((shirt) => shirt.type === type)),
    getById: (state) => (shirtId: string) => state.shirts.find((shirt) => shirt.id === shirtId),
    getBySlug: (state) => (slug: string) => state.shirts.find((shirt) => shirt.slug === slug),
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return this.shirts
      if (this.loading) return this.shirts
      this.loading = true
      this.error = ''
      try {
        const response = await apiRequest<ApiShirt[]>('/shirts')
        this.shirts = response.map(mapShirt)
        this.loaded = true
        return this.shirts
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Could not load your shirts.'
        throw error
      } finally {
        this.loading = false
      }
    },
    async createDraft(type: ShirtType) {
      if (!SHIRT_TYPES.includes(type)) {
        throw new Error('Choose a valid shirt type.')
      }

      if (this.shirts.some((shirt) => shirt.type === type)) {
        throw new Error('You already have this shirt type.')
      }

      if (!this.canCreate) {
        throw new Error('You can create up to two shirts.')
      }

      const shirt = mapShirt(
        await apiRequest<ApiShirt>('/shirts', {
          method: 'POST',
          body: JSON.stringify({
            shirtType: type === 'short-sleeve' ? 'SHORT_SLEEVE' : 'LONG_SLEEVE',
          }),
        }),
      )
      this.shirts.push(shirt)
      return shirt
    },
    async saveDraft(shirtId: string) {
      const shirt = this.getById(shirtId)
      if (!shirt) return false

      await this.load(true)
      return true
    },
    async publish(shirtId: string) {
      const shirt = this.getById(shirtId)
      if (!shirt) return false

      const updated = mapShirt(
        await apiRequest<ApiShirt>(`/shirts/${encodeURIComponent(shirtId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACTIVE' }),
        }),
      )
      this.shirts = this.shirts.map((item) => (item.id === shirtId ? updated : item))
      return true
    },
    reset() {
      this.shirts = []
      this.loaded = false
      this.error = ''
    },
  },
})
