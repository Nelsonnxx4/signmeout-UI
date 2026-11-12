import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiRequest } from '@/lib/api'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('includes cookies and unwraps successful API data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'shirt-1' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/shirts')).resolves.toEqual({ id: 'shirt-1' })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/v1/shirts',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('preserves structured backend error information', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The request contains invalid data',
              details: [{ path: ['email'], message: 'Invalid email' }],
            },
            requestId: 'request-123',
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const error = await apiRequest('/me').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'request-123',
      details: [{ path: ['email'], message: 'Invalid email' }],
    })
  })

  it('rejects malformed success envelopes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ shirt: 'missing envelope' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(apiRequest('/shirts')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'The server returned an invalid response.',
    })
  })
})
