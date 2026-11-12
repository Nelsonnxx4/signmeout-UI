import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

const authState = vi.hoisted(() => ({
  error: null as Error | null,
  session: null as null | {
    user: {
      id: string
      name: string
      email: string
      emailVerified: boolean
      role: string
      createdAt: string
    }
    session: { id: string; expiresAt: string }
  },
}))

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(async () => {
    if (authState.error) throw authState.error
    return authState.session
  }),
  signOut: vi.fn(),
}))

import router from '@/router'

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    authState.error = null
    authState.session = null
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it(
    'preserves the requested location when authentication is required',
    async () => {
      await router.push('/withdrawals')

      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/withdrawals')
    },
    15_000,
  )

  it(
    'keeps the login page available when the session service is offline',
    async () => {
      authState.error = new TypeError('Failed to fetch')

      await router.push('/login')

      expect(router.currentRoute.value.name).toBe('login')
    },
    15_000,
  )

  it(
    'prevents an owner account from entering an admin route',
    async () => {
      authState.session = {
      user: {
        id: 'owner-1',
        name: 'Owner',
        email: 'owner@signmeout.ng',
        emailVerified: true,
        role: 'OWNER',
        createdAt: '2026-11-01T00:00:00.000Z',
      },
      session: { id: 'session-1', expiresAt: '2026-12-01T00:00:00.000Z' },
      }
      vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              completed: true,
              profile: {
                school: { id: 'school-1', name: 'University of Lagos' },
                department: { id: 'department-1', name: 'Computer Science' },
              },
              studentVerification: {
                status: 'APPROVED',
                fullName: 'Owner',
                admissionNumber: 'SCI/2026/0148',
                nickname: null,
              },
              bank: {
                bankName: 'GTBank',
                accountName: 'Owner',
                accountNumber: '******6789',
              },
              commission: {
                policy: { version: '2026-11-08-15pct-v1' },
                acceptedAt: '2026-11-10T00:00:00.000Z',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
      )

      await router.push('/admin/withdrawals')

      expect(router.currentRoute.value.name).toBe('dashboard')
    },
    15_000,
  )
})
