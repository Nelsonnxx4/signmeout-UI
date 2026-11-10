import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { useShirtsStore } from '@/stores/shirts'

describe('shirts store', () => {
  const serverShirts: Array<{
    id: string
    shirtType: 'SHORT_SLEEVE' | 'LONG_SLEEVE'
    slug: string
    status: 'ACTIVE' | 'PAUSED' | 'FULL' | 'ARCHIVED'
    createdAt: string
    updatedAt: string
    modelVersion: { version: number; modelKey: string }
    shareUrl: string
  }> = []

  beforeEach(() => {
    window.sessionStorage.clear()
    serverShirts.splice(0)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        const body = init?.body ? JSON.parse(String(init.body)) : null
        let data: unknown = serverShirts

        if (method === 'POST') {
          const shirt = {
            id: `shirt-${serverShirts.length + 1}`,
            shirtType: body.shirtType,
            slug: `slug-${serverShirts.length + 1}`,
            status: 'PAUSED' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            modelVersion: { version: 1, modelKey: 'shirt-model' },
            shareUrl: `https://signmeout.test/s/slug-${serverShirts.length + 1}`,
          }
          serverShirts.push(shirt)
          data = shirt
        } else if (method === 'PATCH') {
          const shirt = serverShirts[0]
          if (shirt) shirt.status = body.status
          data = shirt
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads account shirts and allows one of each fixed garment type', async () => {
    const shirts = useShirtsStore()
    await shirts.load()

    const shortSleeve = await shirts.createDraft('short-sleeve')

    expect(shortSleeve.status).toBe('draft')
    expect(shortSleeve.modelVersion).toBe('shirt-glb-1')
    expect(shirts.availableTypes).toEqual(['long-sleeve'])
    await expect(shirts.createDraft('short-sleeve')).rejects.toThrow(
      'You already have this shirt type.',
    )

    await shirts.createDraft('long-sleeve')

    expect(shirts.shirtCount).toBe(2)
    expect(shirts.canCreate).toBe(false)
    expect(shirts.availableTypes).toEqual([])
  })

  it('publishes the account shirt through the API and reloads server state', async () => {
    const shirts = useShirtsStore()
    await shirts.load()
    const draft = await shirts.createDraft('short-sleeve')

    expect(await shirts.publish(draft.id)).toBe(true)
    expect(shirts.getById(draft.id)?.status).toBe('published')
    expect(shirts.getById(draft.id)?.publishedAt).toBeTruthy()

    setActivePinia(createPinia())
    const restored = useShirtsStore()
    await restored.load()

    expect(restored.getBySlug(draft.slug)?.id).toBe(draft.id)
    expect(restored.publishedCount).toBe(1)
  })
})
