import { createAuthClient } from 'better-auth/vue'

import { getApiBaseUrl } from '@/lib/api'

interface AuthResponse<T> {
  data: T | null
  error?: { message?: string }
}

export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: string
  createdAt: string
}

export interface AuthSession {
  user: AuthUser
  session: { id: string; expiresAt: string }
}

const authUrl = `${getApiBaseUrl()}/api/v1/auth`
const betterAuth = createAuthClient({
  baseURL: getApiBaseUrl(),
  basePath: '/api/v1/auth',
  fetchOptions: { credentials: 'include' },
})

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${authUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let result: unknown
  try {
    result = await response.json()
  } catch {
    throw new Error(`Authentication failed (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    const error = result as AuthResponse<never>
    throw new Error(error.error?.message || `Authentication failed (HTTP ${response.status}).`)
  }

  return result as T
}

export async function sendSignInCode(email: string) {
  await authRequest('/email-otp/send-verification-otp', {
    email,
    type: 'sign-in',
  })
}

export async function verifySignInCode(email: string, otp: string) {
  await authRequest('/sign-in/email-otp', { email, otp })
}

export async function signInWithGoogle(callbackURL: string) {
  const result = await betterAuth.signIn.social({
    provider: 'google',
    callbackURL,
  })

  if (result.error) {
    throw new Error(result.error.message || 'Could not start Google sign-in.')
  }
}

export async function getAuthSession() {
  const result = await betterAuth.getSession()
  if (result.error) {
    if (result.error.status === 401) return null
    throw new Error(result.error.message || 'Could not check the sign-in session.')
  }
  const session: unknown = result.data
  if (
    typeof session !== 'object' ||
    session === null ||
    !('user' in session) ||
    !('session' in session)
  ) {
    return null
  }
  return session as AuthSession
}

export async function signOut() {
  const result = await betterAuth.signOut()
  if (result.error) {
    throw new Error(result.error.message || 'Could not sign out.')
  }
}
