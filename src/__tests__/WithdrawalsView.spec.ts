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
      adminResponseDeadline: '2026-11-09T10:10:00.000Z',
      processedAt: null,
      failureReason: null,
      transferReference: null,
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
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({
      amountKobo: 1_000_000,
      idempotencyKey: expect.any(String),
    })
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Your payout will be initiated within 10 minutes. Your bank may take longer to credit it.',
    )
    expect(wrapper.text()).toContain('PENDING')
  })

  it('shows a backend withdrawal error without requiring student verification', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [] }))
      .mockResolvedValueOnce(
        response(
          {
            success: false,
            error: { code: 'BANK_REQUIRED', message: 'Add and validate a bank account first.' },
          },
          409,
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WithdrawalsView)
    await flushPromises()
    await wrapper.get('#withdrawal-amount').setValue('100')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Add and validate a bank account')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('cancels a pending withdrawal before its transfer starts', async () => {
    const request = {
      id: 'withdrawal-123',
      amountKobo: 1_000_000,
      status: 'PENDING',
      requestedAt: '2026-11-09T10:00:00.000Z',
      adminResponseDeadline: '2026-11-09T10:10:00.000Z',
      processedAt: null,
      failureReason: null,
      transferReference: null,
    }
    const cancelled = {
      ...request,
      status: 'CANCELLED',
      processedAt: '2026-11-09T10:03:00.000Z',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [request] }))
      .mockResolvedValueOnce(response({ success: true, data: cancelled }))
      .mockResolvedValueOnce(response({ success: true, data: availableSummary }))
      .mockResolvedValueOnce(response({ success: true, data: [cancelled] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )

    const wrapper = mount(WithdrawalsView)
    await flushPromises()
    await wrapper.get('[aria-label="Cancel withdrawal withdrawal-123"]').trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls[2]?.[0]).toMatch(/\/withdrawals\/withdrawal-123\/cancel$/)
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('POST')
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Withdrawal cancelled. The reserved funds are available again.',
    )
    expect(wrapper.text()).toContain('CANCELLED')
    expect(wrapper.find('[aria-label="Cancel withdrawal withdrawal-123"]').exists()).toBe(false)
  })
})
