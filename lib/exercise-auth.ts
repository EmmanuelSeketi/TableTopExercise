import { createHmac, timingSafeEqual } from 'node:crypto'

const ADMIN_COOKIE = 'exercise_admin_session'
const PARTICIPANT_COOKIE = 'exercise_participant_session'
const SESSION_DURATION_SECONDS = 12 * 60 * 60
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_ATTEMPT_LIMIT = 10
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

interface AdminClaims {
  role: 'admin'
  expiresAt: number
}

interface ParticipantClaims {
  role: 'participant'
  deviceId: string
  expiresAt: number
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes')
  }
  return secret
}

function signClaims(claims: AdminClaims | ParticipantClaims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function verifyClaims<T extends AdminClaims | ParticipantClaims>(
  token: string | undefined,
  role: T['role'],
): T | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = createHmac('sha256', getSessionSecret()).update(payload).digest()
  let actual: Buffer
  try {
    actual = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
    if (claims.role !== role || !Number.isFinite(claims.expiresAt) || claims.expiresAt <= Date.now()) {
      return null
    }
    return claims
  } catch {
    return null
  }
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return undefined
  const value = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return value?.slice(name.length + 1)
}

export function createAdminSession() {
  return signClaims({ role: 'admin', expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 })
}

export function isAdminRequest(request: Request) {
  return Boolean(verifyClaims<AdminClaims>(readCookie(request, ADMIN_COOKIE), 'admin'))
}

export function isAdminToken(token: string | undefined) {
  return Boolean(verifyClaims<AdminClaims>(token, 'admin'))
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ??
    request.headers.get('host')
  const protocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ??
    new URL(request.url).protocol.replace(':', '')
  if (!origin || !host) return false

  try {
    return new URL(origin).origin === `${protocol}://${host}`
  } catch {
    return false
  }
}

export function checkLoginAttempt(request: Request, succeeded: boolean) {
  const address =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const now = Date.now()
  const current = loginAttempts.get(address)
  if (!current || current.resetAt <= now) {
    if (loginAttempts.size > 1000) {
      for (const [key, attempt] of loginAttempts) {
        if (attempt.resetAt <= now) loginAttempts.delete(key)
      }
    }
    if (succeeded) {
      loginAttempts.delete(address)
      return { allowed: true, retryAfterSeconds: 0 }
    }
    loginAttempts.set(address, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (succeeded) {
    loginAttempts.delete(address)
    return { allowed: true, retryAfterSeconds: 0 }
  }
  current.count += 1
  return {
    allowed: current.count <= LOGIN_ATTEMPT_LIMIT,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  }
}

export function createParticipantSession(deviceId: string) {
  return signClaims({
    role: 'participant',
    deviceId,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  })
}

export function getParticipantDeviceId(request: Request) {
  return verifyClaims<ParticipantClaims>(readCookie(request, PARTICIPANT_COOKIE), 'participant')?.deviceId
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.AUTH_COOKIE_SECURE === 'true',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  }
}

export const ADMIN_SESSION_COOKIE = ADMIN_COOKIE
export const PARTICIPANT_SESSION_COOKIE = PARTICIPANT_COOKIE
