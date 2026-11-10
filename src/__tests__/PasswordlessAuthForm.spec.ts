import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'

const authMocks = vi.hoisted(() => ({
  sendSignInCode: vi.fn(),
  verifySignInCode: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  sendSignInCode: authMocks.sendSignInCode,
  verifySignInCode: authMocks.verifySignInCode,
  signInWithGoogle: authMocks.signInWithGoogle,
  getAuthSession: vi.fn().mockResolvedValue({
    user: { id: 'user-1', name: 'Owner', email: 'owner@signmeout.ng' },
    session: { id: 'session-1', expiresAt: new Date().toISOString() },
  }),
  signOut: vi.fn(),
}))

const props = {
  intent: 'signup' as const,
  eyebrow: 'Create your shirt owner account',
  title: 'Start with your email',
  description: 'Enter your email.',
  submitLabel: 'Email me a sign-up link',
  sentTitle: 'Check your inbox',
  sentDescription: 'We sent a secure sign-up link to',
  alternateText: 'Already have an account?',
  alternateLabel: 'Sign in',
  alternateTo: '/login',
}

function mountForm() {
  const router = createRouter({ history: createMemoryHistory(), routes: [] })
  return mount(PasswordlessAuthForm, {
    props,
    global: {
      plugins: [createPinia(), router],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('PasswordlessAuthForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    authMocks.sendSignInCode.mockReset().mockResolvedValue(undefined)
    authMocks.verifySignInCode.mockReset().mockResolvedValue(undefined)
    authMocks.signInWithGoogle.mockReset().mockResolvedValue(undefined)
  })

  it('validates the email address before requesting a link', async () => {
    const wrapper = mountForm()

    await wrapper.get('input[name="email"]').setValue('not-an-email')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Enter a valid email address.')
    expect(authMocks.sendSignInCode).not.toHaveBeenCalled()
  })

  it('requests a verification code and shows the confirmation state', async () => {
    const wrapper = mountForm()

    await wrapper.get('input[name="email"]').setValue('owner@signmeout.ng')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(authMocks.sendSignInCode).toHaveBeenCalledWith('owner@signmeout.ng')
    expect(wrapper.get('h1').text()).toBe('Check your inbox')
    expect(wrapper.text()).toContain('owner@signmeout.ng')
  })
})
