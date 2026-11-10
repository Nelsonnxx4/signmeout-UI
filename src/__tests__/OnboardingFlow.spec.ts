import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/App.vue'
import { routes } from '@/router'
import { useOnboardingStore } from '@/stores/onboarding'

describe('owner onboarding flow', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves onboarding through the backend before opening the dashboard', async () => {
    let profile: unknown = null
    let studentVerification: unknown = null
    let bank: unknown = null
    let commissionAcceptedAt: string | null = null
    const status = () => ({
      completed: Boolean(profile && studentVerification && bank && commissionAcceptedAt),
      profile,
      studentVerification,
      bank,
      commission: {
        policy: { version: '2026-11-08-15pct-v1' },
        acceptedAt: commissionAcceptedAt,
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input))
        const path = url.pathname.replace('/api/v1', '')
        const body = init?.body ? JSON.parse(String(init.body)) : null
        let data: unknown = null

        if (path === '/auth/get-session') {
          return new Response(
            JSON.stringify({
              session: { id: 'session-1', expiresAt: '2026-12-01T00:00:00.000Z' },
              user: {
                id: 'owner-1',
                name: 'Owner',
                email: 'owner@signmeout.ng',
                emailVerified: true,
                role: 'OWNER',
                createdAt: '2026-11-01T00:00:00.000Z',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (path === '/onboarding/status') data = status()
        else if (path === '/schools') data = [{ id: 'school-1', name: 'University of Lagos' }]
        else if (path === '/schools/school-1/departments')
          data = [{ id: 'department-1', name: 'Computer Science' }]
        else if (path === '/onboarding/profile' && init?.method === 'PATCH') {
          profile = {
            school: { id: 'school-1', name: 'University of Lagos' },
            department: { id: 'department-1', name: 'Computer Science' },
          }
          data = status()
        } else if (path === '/onboarding/student-verification') {
          studentVerification = {
            status: 'APPROVED',
            fullName: body.fullName,
            admissionNumber: body.admissionNumber,
            nickname: body.nickname ?? null,
          }
          data = status()
        } else if (path === '/banks') {
          data = [{ code: '058', name: 'GTBank' }]
        } else if (path === '/banks/resolve') {
          data = { accountName: 'Nelson Orhembetyoga' }
        } else if (path === '/onboarding/bank') {
          bank = {
            bankName: 'GTBank',
            accountName: 'Nelson Orhembetyoga',
            accountNumber: '******6789',
          }
          data = status()
        } else if (path === '/onboarding/commission') {
          commissionAcceptedAt = '2026-11-10T00:00:00.000Z'
          data = status()
        } else if (path === '/dashboard/summary') {
          data = {
            successfulContributionCount: 0,
            grossContributionsKobo: 0,
            totalOwnerEarningsKobo: 0,
            signatureCount: 0,
            wallet: { availableBalance: 0 },
            recentTransactions: [],
            recentSignatures: [],
          }
        } else if (path === '/wallet/transactions') data = { entries: [], nextCursor: null }
        else if (path === '/shirts') data = []

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )

    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/onboarding/school')

    const wrapper = mount(App, {
      global: { plugins: [pinia, router] },
    })

    await router.isReady()
    await flushPromises()

    await wrapper.get('#school').setValue('University of Lagos')
    await flushPromises()
    await wrapper.get('#department').setValue('Computer Science')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('[role="alert"]').map((alert) => alert.text())).toEqual([])
    expect(useOnboardingStore(pinia).schoolComplete).toBe(true)
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/onboarding/student'), {
      timeout: 10_000,
    })

    await wrapper.get('#student-full-name').setValue('Nelson Orhembetyoga')
    await wrapper.get('#admission-number').setValue('SCI/2026/0148')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/onboarding/bank'), {
      timeout: 10_000,
    })

    await wrapper.get('#bank').setValue('058')
    await wrapper.get('#account-number').setValue('0123456789')
    await wrapper.get('#account-name').setValue('Nelson Orhembetyoga')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/onboarding/commission'), {
      timeout: 10_000,
    })

    await wrapper.get('#commission-accepted').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/dashboard'), {
      timeout: 10_000,
    })
    expect(wrapper.get('h1').text()).toBe('Dashboard')
    expect(wrapper.text()).toContain('Create your first virtual shirt')
    expect(useOnboardingStore(pinia).isComplete).toBe(true)
  }, 45_000)
})
