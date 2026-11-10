const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    if (!response.ok) {
      throw new ApiError(`The request failed (HTTP ${response.status}).`, response.status)
    }
    throw new ApiError('The server returned an invalid response.', response.status)
  }

  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null
    throw new ApiError(
      error && typeof error.message === 'string'
        ? error.message
        : `The request failed (HTTP ${response.status}).`,
      response.status,
      error && typeof error.code === 'string' ? error.code : undefined,
    )
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError('The server returned an invalid response.', response.status)
  }

  return payload.data as T
}

export function getApiBaseUrl() {
  return apiBaseUrl
}
