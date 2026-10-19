'use client'

import { useRouter } from 'next/navigation'
import { ParticipantsSection } from '@/components/sections/participants'
import { ExerciseBrand } from '@/components/exercise-brand'

export default function SignupPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ExerciseBrand />

      <ParticipantsSection onContinue={() => router.push('/participant')} />
    </div>
  )
}