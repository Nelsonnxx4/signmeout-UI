import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/App.vue'
import { routes } from '@/router'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'

describe('shirt creation flow', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a fixed garment draft and publishes its preview', async () => {
    const serverShirts: Array<Record<string, unknown>> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input))
        const path = url.pathname.replace('/api/v1', '')
        const body = init?.body ? JSON.parse(String(init.body)) : null

        if (path === '/auth/get-session') {
          return new Response(
            JSON.stringify({
              session: { id: 'session-1', expiresAt: '2026-12-01T00:00:00.000Z' },
              user: { id: 'owner-1', name: 'Owner', email: 'owner@signmeout.ng' },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        let data: unknown = null
        if (path === '/me') {
          data = {
            id: 'owner-1',
            name: 'Owner',
            email: 'owner@signmeout.ng',
            emailVerified: true,
            role: 'OWNER',
            createdAt: '2026-11-01T00:00:00.000Z',
          }
        } else if (path === '/onboarding/status') {
          data = {
            completed: true,
            profile: {
              school: { id: 'school-1', name: 'University of Lagos' },
              department: { id: 'department-1', name: 'Computer Science' },
            },
            studentVerification: {
              status: 'APPROVED',
              fullName: 'Nelson Orhembetyoga',
              admissionNumber: 'SCI/2026/0148',
              nickname: null,
            },
            bank: {
              bankName: 'GTBank',
              accountName: 'Nelson Orhembetyoga',
              accountNumber: '******6789',
            },
            commission: {
              policy: { version: '2026-11-08-15pct-v1' },
              acceptedAt: '2026-11-10T00:00:00.000Z',
            },
          }
        } else if (path === '/shirts' && init?.method === 'POST') {
          const now = new Date().toISOString()
          const shirt = {
            id: 'shirt-1',
            shirtType: body.shirtType,
            slug: 'owner-short-shirt',
            status: 'PAUSED',
            createdAt: now,
            updatedAt: now,
            modelVersion: { version: 1, modelKey: 'short-sleeve.glb' },
            shareUrl: 'https://signmeout.test/s/owner-short-shirt',
          }
          serverShirts.push(shirt)
          data = shirt
        } else if (path === '/shirts/shirt-1' && init?.method === 'PATCH') {
          const shirt = serverShirts[0]!
          shirt.status = body.status
          shirt.updatedAt = new Date().toISOString()
          data = shirt
        } else if (path === '/shirts') {
          data = serverShirts
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
    const onboarding = useOnboardingStore(pinia)

    onboarding.saveSchool({ school: 'University of Lagos', department: 'Computer Science' })
    onboarding.saveStudentDetails({
      fullName: 'Nelson Orhembetyoga',
      admissionNumber: 'SCI/2026/0148',
    })
    onboarding.saveBank({
      bankCode: '058',
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0123456789',
      accountName: 'Nelson Orhembetyoga',
    })
    onboarding.acceptCommission()

    await router.push('/shirts/new')
    const wrapper = mount(App, {
      global: { plugins: [pinia, router] },
    })

    await router.isReady()
    await flushPromises()

    await wrapper.get('input[value="short-sleeve"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const shirts = useShirtsStore(pinia)
    await vi.waitFor(() => expect(router.currentRoute.value.path).toMatch(/\/shirts\/.+\/edit$/), {
      timeout: 10_000,
    })
    expect(shirts.shirtCount).toBe(1)
    expect(shirts.shirts[0]?.type).toBe('short-sleeve')

    const draft = shirts.shirts[0]!
    await router.push(`/shirts/${draft.id}/preview`)
    await flushPromises()

    const publishButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Publish shirt'))
    expect(publishButton).toBeTruthy()
    await publishButton!.trigger('click')
    await flushPromises()

    expect(shirts.getById(draft.id)?.status).toBe('published')
    expect(wrapper.text()).toContain('View public shirt')
    expect(wrapper.text()).not.toContain('Public link copied')
  }, 30_000)
})
