const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function fallbackErrorMessage(status: number) {
  if (status === 401) return 'Sign in to continue.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This request conflicts with the current account state.'
  if (status === 422) return 'Check the information you entered and try again.'
  if (status === 429) return 'Too many requests. Wait a moment and try again.'
  if (status >= 500) return 'The service is temporarily unavailable. Try again shortly.'
  return `The request failed (HTTP ${status}).`
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new ApiError(
      response.ok ? 'The server returned an invalid response.' : fallbackErrorMessage(response.status),
      response.status,
    )
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/')) {
    throw new TypeError('API paths must start with a forward slash.')
  }

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

  const payload = await readJson(response)

  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null
    const requestId =
      isRecord(payload) && typeof payload.requestId === 'string'
        ? payload.requestId
        : error && typeof error.requestId === 'string'
          ? error.requestId
          : undefined
    throw new ApiError(
      error && typeof error.message === 'string'
        ? error.message
        : fallbackErrorMessage(response.status),
      response.status,
      error && typeof error.code === 'string' ? error.code : undefined,
      error?.details,
      requestId,
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
