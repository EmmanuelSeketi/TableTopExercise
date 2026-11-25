import { NextResponse } from 'next/server'
import { isAdminRequest, hasSameOrigin } from '@/lib/exercise-auth'
import {
  createCustomExercise,
  CustomExerciseInputError,
  listExerciseCatalog,
} from '@/lib/exercise-database'
import { parseCustomExerciseDraft, type CustomExerciseDraft } from '@/lib/custom-exercise-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_REQUEST_BYTES = 12 * 1024 * 1024

export async function GET() {
  try {
    return NextResponse.json(await listExerciseCatalog(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Failed to list custom exercises:', error)
    return NextResponse.json({ error: 'Custom exercises are temporarily unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request) || !isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'Exercise and image uploads must be smaller than 12 MB.' }, { status: 413 })
  }

  let body: unknown
  try {
    const text = await request.text()
    if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Exercise and image uploads must be smaller than 12 MB.' }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  let draft: CustomExerciseDraft
  try {
    draft = parseCustomExerciseDraft(body)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Exercise details are invalid.' },
      { status: 400 },
    )
  }

  try {
    const definition = await createCustomExercise(draft)
    return NextResponse.json({ exercise: definition }, { status: 201 })
  } catch (error) {
    if (error instanceof CustomExerciseInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to create custom exercise:', error)
    return NextResponse.json({ error: 'Exercise could not be saved.' }, { status: 503 })
  }
}
