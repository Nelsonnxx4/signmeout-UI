import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WithdrawalsView from '@/views/withdrawals/WithdrawalsView.vue'

const availableSummary = {
  availableBalance: 2_500_000,
  hasValidBank: true,
}

function response(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

describe('WithdrawalsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits the withdrawal amount in kobo and shows the payout notice on acceptance', async () => {
    const request = {
      id: 'withdrawal-123',
      amountKobo: 1_000_000,
      status: 'PENDING',
      requestedAt: '2026-11-09T10:00:00.000Z',
      processedAt: null,
      failureReason: null,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [] }))
      .mockResolvedValueOnce(response({ success: true, data: request }))
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [request] }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WithdrawalsView)
    await flushPromises()
    await wrapper.get('#withdrawal-amount').setValue('10000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(fetchMock.mock.calls[2]?.[0]).toMatch(/\/api\/v1\/withdrawals$/)
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      amountKobo: 1_000_000,
    })
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Your payout will be initiated within 10 minutes. Your bank may take longer to credit it.',
    )
    expect(wrapper.text()).toContain('PENDING')
  })

  it('shows the backend verification requirement instead of a success message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [] }))
      .mockResolvedValueOnce(
        response(
          {
            success: false,
            error: {
              code: 'VERIFICATION_REQUIRED',
              message: 'Verification must be approved before withdrawing funds.',
            },
          },
          403,
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WithdrawalsView)
    await flushPromises()
    await wrapper.get('#withdrawal-amount').setValue('100')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'The withdrawal service still requires student verification',
    )
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
