import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders the SignMeOut UI foundation', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('SignMeOut controls')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Test validation')
  })
})
