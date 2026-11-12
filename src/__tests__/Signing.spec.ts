import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isPlacementConfig,
  uploadAndSubmitSignature,
  type SignaturePlacement,
} from '@/lib/signing'

describe('signature API flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests an upload, uploads the file, then submits server coordinates', async () => {
    const upload = {
      assetKey: 'signature-uploads/entitlement/file.png',
      uploadUrl: 'https://storage.example.test/upload',
      expiresInSeconds: 300,
      requiredHeaders: {
        'Content-Type': 'image/png',
        'Content-Length': '4',
        'x-amz-meta-entitlement': 'entitlement',
      },
      shirtId: 'shirt-1',
      signatureSize: 2,
    }
    const created = {
      id: 'signature-1',
      surfaceId: 'front',
      uvX: 0.5,
      uvY: 0.5,
      width: 0.1,
      height: 0.05,
      rotation: 0,
      scale: 2,
      submittedAt: '2026-11-11T10:00:00.000Z',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: upload }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: created }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'signature.png', {
      type: 'image/png',
    })
    const placement: SignaturePlacement = {
      surfaceId: 'front',
      uvX: 0.5,
      uvY: 0.5,
      width: 0.1,
      height: 0.05,
      rotation: 0,
      scale: 2,
    }

    await expect(uploadAndSubmitSignature('signing-token', file, placement)).resolves.toEqual(
      created,
    )

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(requestHeaders.get('Authorization')).toBe('Bearer signing-token')
    const storageHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers
    expect(storageHeaders.get('Content-Type')).toBe('image/png')
    expect(storageHeaders.has('Content-Length')).toBe(false)
    expect(fetchMock.mock.calls[2]?.[1]?.body).toContain(upload.assetKey)
  })

  it('only accepts a complete server placement configuration', () => {
    expect(isPlacementConfig({ version: 1, surfaces: [{ id: 'front' }] })).toBe(false)
    expect(
      isPlacementConfig({
        version: 1,
        surfaces: [
          {
            id: 'front',
            bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
            restrictedRegions: [],
            maxSignatureWidth: 0.2,
            maxSignatureHeight: 0.1,
          },
        ],
      }),
    ).toBe(true)
  })
})
