import { apiRequest } from '@/lib/api'

export interface PlacementRegion {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface PlacementSurface {
  id: string
  bounds: PlacementRegion
  restrictedRegions: PlacementRegion[]
  maxSignatureWidth: number
  maxSignatureHeight: number
}

export interface PlacementConfig {
  version: number
  surfaces: PlacementSurface[]
}

export interface SignatureUpload {
  assetKey: string
  uploadUrl: string
  expiresInSeconds: number
  requiredHeaders: Record<string, string>
  shirtId: string
  signatureSize: number
}

export interface SignaturePlacement {
  surfaceId: string
  uvX: number
  uvY: number
  width: number
  height: number
  rotation: number
  scale: number
}

export interface CreatedSignature extends SignaturePlacement {
  id: string
  submittedAt: string
}

export class SignatureUploadError extends Error {
  constructor(readonly status: number) {
    super(`The signature file upload failed (HTTP ${status}).`)
    this.name = 'SignatureUploadError'
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPlacementRegion(value: unknown): value is PlacementRegion {
  if (typeof value !== 'object' || value === null) return false
  const region = value as Record<string, unknown>
  if (
    !isFiniteNumber(region.minX) ||
    !isFiniteNumber(region.minY) ||
    !isFiniteNumber(region.maxX) ||
    !isFiniteNumber(region.maxY)
  ) {
    return false
  }

  return (
    region.minX >= 0 &&
    region.minY >= 0 &&
    region.maxX <= 1 &&
    region.maxY <= 1 &&
    region.minX < region.maxX &&
    region.minY < region.maxY
  )
}

export function isPlacementConfig(value: unknown): value is PlacementConfig {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Record<string, unknown>
  if (!Number.isInteger(config.version) || !Array.isArray(config.surfaces)) return false

  const surfaceIds = new Set<string>()
  return config.surfaces.length > 0 && config.surfaces.every((value) => {
    if (typeof value !== 'object' || value === null) return false
    const surface = value as Record<string, unknown>
    if (
      typeof surface.id !== 'string' ||
      !surface.id ||
      surfaceIds.has(surface.id) ||
      !isPlacementRegion(surface.bounds) ||
      !Array.isArray(surface.restrictedRegions) ||
      !surface.restrictedRegions.every(isPlacementRegion) ||
      !isFiniteNumber(surface.maxSignatureWidth) ||
      !isFiniteNumber(surface.maxSignatureHeight) ||
      surface.maxSignatureWidth <= 0 ||
      surface.maxSignatureHeight <= 0 ||
      surface.maxSignatureWidth > 1 ||
      surface.maxSignatureHeight > 1
    ) {
      return false
    }
    const bounds = surface.bounds as PlacementRegion
    const restrictedRegions = surface.restrictedRegions as PlacementRegion[]
    if (
      surface.maxSignatureWidth > bounds.maxX - bounds.minX ||
      surface.maxSignatureHeight > bounds.maxY - bounds.minY ||
      restrictedRegions.some(
        (region) =>
          region.minX < bounds.minX ||
          region.minY < bounds.minY ||
          region.maxX > bounds.maxX ||
          region.maxY > bounds.maxY,
      )
    ) {
      return false
    }
    surfaceIds.add(surface.id)
    return true
  })
}

export async function requestSignatureUpload(accessToken: string, file: File) {
  return apiRequest<SignatureUpload>('/signing/assets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
  })
}

export async function uploadSignatureAsset(upload: SignatureUpload, file: File) {
  const headers = new Headers()
  for (const [name, value] of Object.entries(upload.requiredHeaders)) {
    // Browsers calculate this forbidden request header from the Blob body.
    if (name.toLowerCase() !== 'content-length') headers.set(name, value)
  }

  const response = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  })
  if (!response.ok) throw new SignatureUploadError(response.status)
}

export async function submitSignature(accessToken: string, assetKey: string, placement: SignaturePlacement) {
  return apiRequest<CreatedSignature>('/signatures', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ assetKey, ...placement }),
  })
}

export async function uploadAndSubmitSignature(
  accessToken: string,
  file: File,
  placement: SignaturePlacement,
) {
  const upload = await requestSignatureUpload(accessToken, file)
  await uploadSignatureAsset(upload, file)
  return submitSignature(accessToken, upload.assetKey, placement)
}
