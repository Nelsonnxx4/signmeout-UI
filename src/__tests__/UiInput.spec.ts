import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import { UiInput } from '@/components/ui/input'

describe('UiInput', () => {
  it('emits updated text', async () => {
    const wrapper = mount(UiInput)

    await wrapper.get('input').setValue('nelson@signmeout.ng')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['nelson@signmeout.ng'])
  })

  it('exposes its invalid state to assistive technology', () => {
    const wrapper = mount(UiInput, { props: { invalid: true } })

    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('supports prefixes and accessory slots', () => {
    const wrapper = mount(UiInput, {
      props: { prefix: 'signmeout.ng/' },
      slots: {
        leading: '<svg data-test="leading" />',
        trailing: '<kbd>Ctrl K</kbd>',
      },
    })

    expect(wrapper.text()).toContain('signmeout.ng/')
    expect(wrapper.find('[data-test="leading"]').exists()).toBe(true)
    expect(wrapper.get('kbd').text()).toBe('Ctrl K')
  })
})
