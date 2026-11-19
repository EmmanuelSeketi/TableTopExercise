import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, isAdminToken } from '@/lib/exercise-auth'
import { getExerciseIdFromUrl } from '@/lib/exercise-instances'
import ModerateClientPage from './moderate-client-page'

interface ModeratePageProps {
  searchParams: Promise<{ exercise?: string | string[] }>
}

export default async function ModeratePage({ searchParams }: ModeratePageProps) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!isAdminToken(token)) {
    const { exercise } = await searchParams
    const exerciseId = typeof exercise === 'string'
      ? getExerciseIdFromUrl(`http://localhost/moderate?exercise=${encodeURIComponent(exercise)}`)
      : null
    const destination = exerciseId
      ? `/moderate?exercise=${encodeURIComponent(exerciseId)}`
      : '/moderate'

    redirect(`/login?next=${encodeURIComponent(destination)}`)
  }

  return <ModerateClientPage />
}
