import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import { UiSelect } from '@/components/ui/select'

describe('UiSelect', () => {
  it('emits the selected value', async () => {
    const wrapper = mount(UiSelect, {
      slots: {
        default: '<option value="">Choose</option><option value="unilag">UNILAG</option>',
      },
    })

    await wrapper.get('select').setValue('unilag')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['unilag'])
  })

  it('exposes an invalid selection to assistive technology', () => {
    const wrapper = mount(UiSelect, {
      props: { invalid: true },
      slots: { default: '<option value="">Choose</option>' },
    })

    expect(wrapper.get('select').attributes('aria-invalid')).toBe('true')
  })
})
