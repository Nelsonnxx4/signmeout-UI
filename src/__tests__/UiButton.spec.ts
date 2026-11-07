import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import { UiButton } from '@/components/ui/button'

describe('UiButton', () => {
  it('uses a safe button type by default', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Continue' } })

    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Continue')
  })

  it('disables the control while loading', () => {
    const wrapper = mount(UiButton, {
      props: { loading: true },
      slots: { default: 'Saving' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })
})
