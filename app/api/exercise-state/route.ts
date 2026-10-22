import { NextResponse } from 'next/server'
import { getExerciseState, patchExerciseState } from '@/lib/exercise-database'
import { getParticipantDeviceId, hasSameOrigin, isAdminRequest } from '@/lib/exercise-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const privateStateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Vary: 'Cookie',
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export async function GET(request: Request) {
  try {
    const state = await getExerciseState()
    const participantDeviceId = getParticipantDeviceId(request) ?? null
    const visibleState = isAdminRequest(request)
      ? { ...state, currentParticipantId: participantDeviceId }
      : {
          currentParticipantId: participantDeviceId,
          activeInjectId: state.activeInjectId,
          facilitatorPhase: state.facilitatorPhase,
          settings: { theme: state.settings.theme },
          responses: state.responses.filter(
            (response) => response.participantId === participantDeviceId,
          ),
        }
    return NextResponse.json(visibleState, {
      headers: privateStateHeaders,
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
  if (!hasSameOrigin(request) || !isAdminRequest(request)) {
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
