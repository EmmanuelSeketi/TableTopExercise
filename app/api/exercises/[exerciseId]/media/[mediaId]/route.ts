import { NextResponse } from 'next/server'
import { getCustomExerciseImage } from '@/lib/exercise-database'
import { isManagedExerciseId } from '@/lib/exercise-instances'

export const runtime = 'nodejs'

interface ExerciseMediaRouteProps {
  params: Promise<{ exerciseId: string; mediaId: string }>
}

export async function GET(_request: Request, { params }: ExerciseMediaRouteProps) {
  const { exerciseId, mediaId } = await params
  if (!isManagedExerciseId(exerciseId)) {
    return NextResponse.json({ error: 'Exercise image not found.' }, { status: 404 })
  }

  try {
    const image = await getCustomExerciseImage(exerciseId, mediaId)
    if (!image) return NextResponse.json({ error: 'Exercise image not found.' }, { status: 404 })
    return new Response(new Uint8Array(image.imageData), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Failed to load custom exercise image:', error)
    return NextResponse.json({ error: 'Exercise image is temporarily unavailable.' }, { status: 503 })
  }
}
