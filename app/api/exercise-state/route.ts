import { NextResponse } from 'next/server'
import { getExerciseState, patchExerciseState } from '@/lib/exercise-database'

export const runtime = 'nodejs'

const API_SECRET = process.env.EXERCISE_API_SECRET || ''

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function checkAuth(request: Request) {
  return !API_SECRET || request.headers.get('x-api-secret') === API_SECRET
}

export async function GET() {
  try {
    return NextResponse.json(await getExerciseState(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error(
      'Failed to read exercise state from PostgreSQL:',
      error instanceof Error ? error.stack : error,
    )
    return NextResponse.json({ error: 'Exercise state is temporarily unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let patch: unknown
  try {
    patch = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }
  if (!isPlainObject(patch)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 })
  }

  try {
    return NextResponse.json(await patchExerciseState(patch), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Failed to save exercise state to PostgreSQL:', error)
    return NextResponse.json({ error: 'Exercise state could not be saved' }, { status: 503 })
  }
}
