import { NextResponse } from 'next/server'
import { submitExerciseResponse } from '@/lib/exercise-database'

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
    !('participantId' in body) ||
    !('injectId' in body) ||
    !('choice' in body) ||
    typeof body.participantId !== 'string' ||
    !body.participantId.trim() ||
    typeof body.injectId !== 'string' ||
    !body.injectId.trim() ||
    typeof body.choice !== 'string' ||
    !body.choice.trim()
  ) {
    return NextResponse.json(
      { error: 'A participant ID, inject ID, and choice are required' },
      { status: 400 }
    )
  }

  try {
    const result = await submitExerciseResponse({
      participantId: body.participantId.trim(),
      injectId: body.injectId.trim(),
      choice: body.choice.trim(),
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Failed to save participant response to PostgreSQL:', error)
    return NextResponse.json({ error: 'Response could not be saved' }, { status: 503 })
  }
}
