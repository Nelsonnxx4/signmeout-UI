import { describe, it, expect } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'

import App from '../App.vue'

describe('App', () => {
  it('renders the passwordless signup route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/signup')

    const wrapper = mount(App, {
      global: { plugins: [router] },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Start with your email')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Email me a sign-up link')
  }, 15_000)
})
