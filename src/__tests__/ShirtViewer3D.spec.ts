import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import ShirtViewer3D from '@/components/shirts/ShirtViewer3D.vue'

describe('ShirtViewer3D', () => {
  it('keeps front and back controls available in the performance fallback', async () => {
    const wrapper = mount(ShirtViewer3D, {
      props: {
        type: 'short-sleeve',
        view: 'front',
        mode: 'fallback',
      },
    })

    expect(wrapper.text()).toContain('3D is off to keep this page responsive')
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('front preview')
    expect(wrapper.get('button[aria-label="Rotate shirt left"]').attributes('disabled')).toBe('')

    await wrapper.get('button[aria-pressed="false"]').trigger('click')
    const viewUpdates = wrapper.emitted('update:view')
    expect(viewUpdates?.[viewUpdates.length - 1]).toEqual(['back'])

    await wrapper.setProps({ view: 'back' })
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('back preview')
  })
})
