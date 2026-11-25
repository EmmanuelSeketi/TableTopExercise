'use client'

import { useRouter } from 'next/navigation'
import { ExerciseOverviewVisual } from '@/components/inject-visual'
import { ParticipantsSection } from '@/components/sections/participants'
import { useExerciseDefinition, useExerciseSelectionReady } from '@/lib/exercise-selection'

export default function SignupPage() {
  const router = useRouter()
  const definition = useExerciseDefinition()
  const selectionReady = useExerciseSelectionReady()

  if (!selectionReady) {
    return (
      <div role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
        Loading selected exercise...
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-primary">
            {definition.organization}{definition.id === 'zechl' ? '' : ` · ${definition.audience} exercise`}
          </h1>
          <p className="text-sm text-muted-foreground">{definition.scenario.title} · {definition.durationMinutes} minutes</p>
        </div>
        {definition.id.startsWith('custom-') ? (
          <ExerciseOverviewVisual
            src={definition.scenario.overviewImageUrl ?? definition.organizationImageUrl ?? '/images/signup cover.jpg'}
            alt={`${definition.organization} exercise overview`}
          />
        ) : definition.id === 'zechl' ? (
          <ExerciseOverviewVisual
            src="/images/ZECHL/Zechl Overview.jpg"
            alt="ZECHL critical payment infrastructure overview"
          />
        ) : (
          <ExerciseOverviewVisual
            src={definition.organization === 'Mimosa Mine' ? '/Overview Image.jpg' : '/images/signup cover.jpg'}
            alt={definition.organization === 'Mimosa Mine' ? 'Aerial view of Mimosa Mine' : 'Illustrative exercise setting'}
          />
        )}
        <ParticipantsSection onContinue={() => router.push(`/participant${window.location.search}`)} />
      </div>
    </div>
  )
}