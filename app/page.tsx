'use client'

import { Plus } from 'lucide-react'
import { ExerciseSelectionCard } from '@/components/exercise-selection-card'
import { Card } from '@/components/ui/card'
import { useExerciseCatalog } from '@/lib/exercise-selection'

const exerciseInstances = [
  {
    id: 'meridian',
    organization: 'Meridian Financial Group',
    audience: 'Management & technical',
    description: 'Operation Ledger Lock',
    image: '/images/inject0.png',
    imageAlt: 'Illustrative Meridian exercise scenario',
  },
  {
    id: 'mimosa-technical',
    organization: 'Mimosa Mine',
    audience: 'Technical team',
    description: 'Underground communications disruption · 60 minutes',
    image: '/Overview Image.jpg',
    imageAlt: 'Aerial view of Mimosa Mine',
  },
  {
    id: 'mimosa-management',
    organization: 'Mimosa Mine',
    audience: 'Management team',
    description: 'Critical third-party service disruption · 60 minutes',
    image: '/Overview Image.jpg',
    imageAlt: 'Aerial view of Mimosa Mine',
  },
  {
    id: 'zechl',
    organization: 'Zambia Electronic Clearing House Limited',
    audience: 'Management & technical',
    description: 'Privileged account compromise and payment system manipulation · 90 minutes',
    image: '/images/ZECHL/Zechl Overview.jpg',
    imageAlt: 'ZECHL critical payment infrastructure overview',
  },
] as const

export default function Page() {
  const { catalog, builtInDefinitions, deletedExerciseIds, catalogReady } = useExerciseCatalog()

  return (
    <main className="mx-auto flex min-h-svh w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Choose an organization</h1>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-label="Exercise instances">
        {exerciseInstances
          .filter((instance) => !deletedExerciseIds.includes(instance.id))
          .map((instance) => {
            const definition = builtInDefinitions[instance.id]
            return (
              <ExerciseSelectionCard
                key={instance.id}
                id={instance.id}
                organization={definition?.organization ?? instance.organization}
                audience={definition?.audience ?? instance.audience}
                description={definition
                  ? `${definition.title} · ${definition.durationMinutes} minutes`
                  : instance.description}
                image={definition?.organizationImageUrl ?? definition?.scenario.overviewImageUrl ?? instance.image}
                imageAlt={instance.imageAlt}
              />
            )
          })}
        {catalog.map((exercise) => (
          <ExerciseSelectionCard
            key={exercise.id}
            id={exercise.id}
            organization={exercise.organization}
            audience={exercise.audience}
            description={`${exercise.title} · ${exercise.durationMinutes} minutes`}
            image={exercise.organizationImageUrl ?? '/images/signup cover.jpg'}
            imageAlt={`${exercise.organization} exercise`}
          />
        ))}
        <a
          href="/login?next=%2Fcreate-exercise"
          aria-label="Create an exercise"
          className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Card className="flex h-full min-h-[15rem] items-center justify-center border-2 border-dotted border-slate-400 bg-slate-100 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary group-hover:bg-slate-200 group-hover:shadow-lg">
            <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors group-hover:border-primary group-hover:text-primary">
                <Plus aria-hidden="true" className="size-9" />
              </span>
              <span className="text-lg font-semibold text-slate-900">Create an exercise</span>
            </div>
          </Card>
        </a>
      </section>
      {!catalogReady && <p role="status" className="text-center text-sm text-muted-foreground">Loading your custom exercises…</p>}
    </main>
  )
}
