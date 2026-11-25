import { NextResponse } from 'next/server'
import { isAdminRequest, hasSameOrigin } from '@/lib/exercise-auth'
import {
  archiveManagedExercise,
  CustomExerciseInputError,
  getExerciseDefinitionById,
  updateManagedExercise,
} from '@/lib/exercise-database'
import { isManagedExerciseId } from '@/lib/exercise-instances'
import { parseCustomExerciseDraft, type CustomExerciseDraft } from '@/lib/custom-exercise-types'

export const runtime = 'nodejs'
const MAX_REQUEST_BYTES = 12 * 1024 * 1024

interface ExerciseDefinitionRouteProps {
  params: Promise<{ exerciseId: string }>
}

export async function GET(_request: Request, { params }: ExerciseDefinitionRouteProps) {
  const { exerciseId } = await params
  if (!isManagedExerciseId(exerciseId)) {
    return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
  }

  try {
    const definition = await getExerciseDefinitionById(exerciseId)
    if (!definition) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
    return NextResponse.json(definition, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Failed to load exercise definition:', error)
    return NextResponse.json({ error: 'Exercise definition is temporarily unavailable.' }, { status: 503 })
  }
}

export async function PUT(request: Request, { params }: ExerciseDefinitionRouteProps) {
  const { exerciseId } = await params
  if (!isManagedExerciseId(exerciseId)) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
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
    draft = parseCustomExerciseDraft(body, { allowMissingOrganizationImage: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Exercise details are invalid.' },
      { status: 400 },
    )
  }

  try {
    const exercise = await updateManagedExercise(exerciseId, draft)
    if (!exercise) return NextResponse.json({ error: 'Exercise not found or is deleted.' }, { status: 404 })
    return NextResponse.json({ exercise })
  } catch (error) {
    if (error instanceof CustomExerciseInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to update exercise:', error)
    return NextResponse.json({ error: 'Exercise could not be updated.' }, { status: 503 })
  }
}

export async function DELETE(request: Request, { params }: ExerciseDefinitionRouteProps) {
  const { exerciseId } = await params
  if (!isManagedExerciseId(exerciseId)) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
  if (!hasSameOrigin(request) || !isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const archived = await archiveManagedExercise(exerciseId)
    if (!archived) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete exercise:', error)
    return NextResponse.json({ error: 'Exercise could not be deleted.' }, { status: 503 })
  }
}
