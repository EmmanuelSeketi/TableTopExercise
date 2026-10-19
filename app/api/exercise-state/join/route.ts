import { NextResponse } from 'next/server'
import { joinExercise } from '@/lib/exercise-database'
import { ROLES } from '@/lib/exercise-data'

export const runtime = 'nodejs'

const API_SECRET = process.env.EXERCISE_API_SECRET || ''

export async function POST(request: Request) {
  if (API_SECRET && request.headers.get('x-api-secret') !== API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    !('deviceId' in body) ||
    !('name' in body) ||
    !('roleId' in body) ||
    typeof body.deviceId !== 'string' ||
    !body.deviceId.trim() ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    typeof body.roleId !== 'string' ||
    !ROLES.some((role) => role.id === body.roleId)
  ) {
    return NextResponse.json({ error: 'A valid device ID, name, and role are required' }, { status: 400 })
  }

  try {
    const result = await joinExercise({
      deviceId: body.deviceId.trim(),
      name: body.name.trim(),
      roleId: body.roleId as (typeof ROLES)[number]['id'],
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Failed to register participant in PostgreSQL:', error)
    return NextResponse.json({ error: 'Participant registration is temporarily unavailable' }, { status: 503 })
  }
}
