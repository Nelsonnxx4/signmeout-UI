import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/App.vue'
import { routes } from '@/router'
import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'

describe('shirt creation flow', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('creates a fixed garment draft and publishes its preview', async () => {
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
    const onboarding = useOnboardingStore(pinia)

    onboarding.saveSchool({ school: 'University of Lagos', department: 'Computer Science' })
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
