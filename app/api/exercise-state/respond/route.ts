import { NextResponse } from 'next/server'
import { getExerciseState, submitExerciseResponse } from '@/lib/exercise-database'
import { getParticipantDeviceId, hasSameOrigin } from '@/lib/exercise-auth'
import { INJECTS } from '@/lib/exercise-data'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  const participantId = getParticipantDeviceId(request)
  if (!participantId) return NextResponse.json({ error: 'Join the exercise before responding' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('injectId' in body) ||
    !('choice' in body) ||
    typeof body.injectId !== 'string' ||
    !body.injectId.trim() ||
    typeof body.choice !== 'string' ||
    !body.choice.trim()
  ) {
    return NextResponse.json(
      { error: 'An inject ID and choice are required' },
      { status: 400 }
    )
  }

  try {
    const inject = INJECTS.find((item) => item.id === body.injectId)
    if (!inject?.choices.some((choice) => choice.id === body.choice)) {
      return NextResponse.json({ error: 'The selected inject or answer is invalid' }, { status: 400 })
    }
    const state = await getExerciseState()
    if (!state.participants.some((participant) => participant.deviceId === participantId)) {
      return NextResponse.json({ error: 'Participant registration was not found; please join again' }, { status: 401 })
    }
    const result = await submitExerciseResponse({
      participantId,
      injectId: body.injectId.trim(),
      choice: body.choice.trim(),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Failed to save participant response to PostgreSQL:', error)
    return NextResponse.json({ error: 'Response could not be saved' }, { status: 503 })
  }
}
