import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ExerciseBuilder } from '@/components/exercise-builder'
import { ADMIN_SESSION_COOKIE, isAdminToken } from '@/lib/exercise-auth'
import { getExerciseDefinitionById, isExerciseArchived } from '@/lib/exercise-database'
import { isManagedExerciseId } from '@/lib/exercise-instances'

interface CreateExercisePageProps {
  searchParams: Promise<{ edit?: string | string[] }>
}

export default async function CreateExercisePage({ searchParams }: CreateExercisePageProps) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!isAdminToken(token)) redirect('/login?next=%2Fcreate-exercise')
  const { edit } = await searchParams
  const exerciseId = Array.isArray(edit) ? edit[0] : edit
  if (!exerciseId) return <ExerciseBuilder />
  if (!isManagedExerciseId(exerciseId) || await isExerciseArchived(exerciseId)) notFound()
  const definition = await getExerciseDefinitionById(exerciseId)
  if (!definition) notFound()
  return <ExerciseBuilder initialDefinition={definition} />
}
