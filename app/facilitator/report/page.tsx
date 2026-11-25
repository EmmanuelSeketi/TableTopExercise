import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ExerciseReportPage } from '@/components/exercise-report'
import { ADMIN_SESSION_COOKIE, isAdminToken } from '@/lib/exercise-auth'
import { getExerciseIdFromUrl } from '@/lib/exercise-instances'

interface FacilitatorReportRouteProps {
  searchParams: Promise<{ exercise?: string | string[] }>
}

export default async function FacilitatorReportRoute({ searchParams }: FacilitatorReportRouteProps) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  const { exercise } = await searchParams
  const exerciseId = typeof exercise === 'string'
    ? getExerciseIdFromUrl(`http://localhost/facilitator/report?exercise=${encodeURIComponent(exercise)}`)
    : null

  if (!isAdminToken(token)) {
    const destination = exerciseId
      ? `/facilitator/report?exercise=${encodeURIComponent(exerciseId)}`
      : '/facilitator/report'
    redirect(`/login?next=${encodeURIComponent(destination)}`)
  }

  return <ExerciseReportPage />
}
