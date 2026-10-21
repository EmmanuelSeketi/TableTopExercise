import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  checkLoginAttempt,
  createAdminSession,
  hasSameOrigin,
  sessionCookieOptions,
} from '@/lib/exercise-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  const configuredPassword = process.env.FACILITATOR_PASSWORD
  if (!configuredPassword || !process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Facilitator access is not configured on the server' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('password' in body) ||
    typeof body.password !== 'string' ||
    body.password.length > 1024
  ) {
    return NextResponse.json({ error: 'A password is required' }, { status: 400 })
  }

  const attempts = checkLoginAttempt(request, false)
  if (!attempts.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSeconds) } },
    )
  }

  const expected = createHash('sha256').update(configuredPassword).digest()
  const actual = createHash('sha256').update(body.password).digest()
  if (!timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }
  checkLoginAttempt(request, true)

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), sessionCookieOptions())
  return response
}
