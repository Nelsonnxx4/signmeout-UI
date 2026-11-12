import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AdminWithdrawalsView from '@/views/admin/AdminWithdrawalsView.vue'

describe('AdminWithdrawalsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads withdrawal requests from the admin API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'withdrawal-123',
            userId: 'owner-456',
            amountKobo: 1_250_000,
            status: 'PROCESSING',
            requestedAt: '2026-11-09T10:00:00.000Z',
            processedAt: null,
            failureReason: null,
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(AdminWithdrawalsView)
    await flushPromises()

    expect(wrapper.text()).toContain('withdrawal-123')
    expect(wrapper.text()).toContain('owner-456')
    expect(wrapper.text()).toContain('12,500')
    expect(wrapper.text()).toContain('PROCESSING')
    expect(wrapper.text()).toContain('1 shown')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/admin\/withdrawals$/),
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('shows a clear access error when the API denies the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      }),
    )

    const wrapper = mount(AdminWithdrawalsView)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('You do not have permission')
    expect(wrapper.text()).toContain('Request list unavailable. Try refreshing.')
  })
})
