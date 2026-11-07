import { describe, expect, it } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'

import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'

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
  return mount(PasswordlessAuthForm, {
    props,
    global: {
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
  it('validates the email address before requesting a link', async () => {
    const wrapper = mountForm()

    await wrapper.get('input[name="email"]').setValue('not-an-email')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Enter a valid email address.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits a passwordless request and shows the confirmation state', async () => {
    const wrapper = mountForm()

    await wrapper.get('input[name="email"]').setValue('owner@signmeout.ng')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { email: 'owner@signmeout.ng', intent: 'signup' },
    ])
    expect(wrapper.get('h1').text()).toBe('Check your inbox')
    expect(wrapper.text()).toContain('owner@signmeout.ng')
  })
})
