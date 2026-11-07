import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('moves from school details through commission acceptance to the dashboard', async () => {
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
    await wrapper.get('#department').setValue('Computer Science')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('[role="alert"]').map((alert) => alert.text())).toEqual([])
    expect(useOnboardingStore(pinia).schoolComplete).toBe(true)
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
