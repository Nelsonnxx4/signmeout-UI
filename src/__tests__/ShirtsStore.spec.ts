import { beforeEach, describe, expect, it } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { useShirtsStore } from '@/stores/shirts'

describe('shirts store', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('allows one shirt of each fixed garment type', () => {
    const shirts = useShirtsStore()

    const shortSleeve = shirts.createDraft('short-sleeve')

    expect(shortSleeve.status).toBe('draft')
    expect(shirts.availableTypes).toEqual(['long-sleeve'])
    expect(() => shirts.createDraft('short-sleeve')).toThrow('You already have this shirt type.')

    shirts.createDraft('long-sleeve')

    expect(shirts.shirtCount).toBe(2)
    expect(shirts.canCreate).toBe(false)
    expect(shirts.availableTypes).toEqual([])
  })

  it('persists drafts and publishing state in the current session', () => {
    const shirts = useShirtsStore()
    const draft = shirts.createDraft('short-sleeve')

    expect(shirts.publish(draft.id)).toBe(true)
    expect(shirts.getById(draft.id)?.status).toBe('published')
    expect(shirts.getById(draft.id)?.publishedAt).toBeTruthy()

    setActivePinia(createPinia())
    const restored = useShirtsStore()

    expect(restored.getBySlug(draft.slug)?.id).toBe(draft.id)
    expect(restored.publishedCount).toBe(1)
  })
})
