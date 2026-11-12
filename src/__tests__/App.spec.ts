import { describe, it, expect, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'

import App from '../App.vue'

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn().mockResolvedValue(null),
  sendSignInCode: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  verifySignInCode: vi.fn(),
}))

describe('App', () => {
  it('renders the passwordless signup route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/signup')

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Start with your email')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Email me a verification code')
  }, 15_000)
})
