import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { joinExercise } from '@/lib/exercise-database'
import { ROLES } from '@/lib/exercise-data'
import {
  createParticipantSession,
  getParticipantDeviceId,
  hasSameOrigin,
  PARTICIPANT_SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/exercise-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    !('roleId' in body) ||
    typeof body.name !== 'string' ||
    body.name.trim().length > 100 ||
    !body.name.trim() ||
    typeof body.roleId !== 'string' ||
    !ROLES.some((role) => role.id === body.roleId)
  ) {
    return NextResponse.json({ error: 'A valid name and role are required' }, { status: 400 })
  }

  try {
    const deviceId = getParticipantDeviceId(request) ?? randomUUID()
    const result = await joinExercise({
      deviceId,
      name: body.name.trim(),
      roleId: body.roleId as (typeof ROLES)[number]['id'],
    })
    const response = NextResponse.json({ success: true, participant: result.participant })
    response.cookies.set(
      PARTICIPANT_SESSION_COOKIE,
      createParticipantSession(result.participant.deviceId),
      sessionCookieOptions(),
    )
    return response
  } catch (error) {
    console.error('Failed to register participant in PostgreSQL:', error)
    return NextResponse.json({ error: 'Participant registration is temporarily unavailable' }, { status: 503 })
  }
}
