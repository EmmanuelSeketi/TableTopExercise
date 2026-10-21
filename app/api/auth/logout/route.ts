import { NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  hasSameOrigin,
  PARTICIPANT_SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/exercise-auth'

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  response.cookies.set(PARTICIPANT_SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}
