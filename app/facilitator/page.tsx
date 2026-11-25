import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import FacilitatorPage from '@/components/facilitator-page'
import { ADMIN_SESSION_COOKIE, isAdminToken } from '@/lib/exercise-auth'
import { getExerciseIdFromUrl } from '@/lib/exercise-instances'

interface FacilitatorRouteProps {
  searchParams: Promise<{ exercise?: string | string[] }>
}

export default async function FacilitatorRoute({ searchParams }: FacilitatorRouteProps) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  const { exercise } = await searchParams
  const exerciseId = typeof exercise === 'string'
    ? getExerciseIdFromUrl(`http://localhost/facilitator?exercise=${encodeURIComponent(exercise)}`)
    : null

  if (!isAdminToken(token)) {
    const destination = exerciseId
      ? `/facilitator?exercise=${encodeURIComponent(exerciseId)}`
      : '/facilitator'
    redirect(`/login?next=${encodeURIComponent(destination)}`)
  }

  return <FacilitatorPage />
}
