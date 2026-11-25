import { ExerciseOverviewVisual } from '@/components/inject-visual'
import type { ExerciseDefinition } from '@/lib/exercise-instances'

interface ExerciseOverviewProps {
  definition: ExerciseDefinition
}

export function ExerciseOverview({ definition }: ExerciseOverviewProps) {
  const isZechl = definition.id === 'zechl'
  const isCustom = definition.id.startsWith('custom-')
  const overviewImage = definition.scenario.overviewImageUrl ?? definition.organizationImageUrl
  const overviewParagraphs = definition.scenario.initialSituation
    .split(/\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div className={isZechl ? 'mx-auto max-w-6xl space-y-5' : 'space-y-6'}>
      {isZechl ? (
        <header className="pb-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Exercise overview</p>
          <h1
            className="mt-2 w-full text-left text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl"
          >
            {definition.scenario.title}
          </h1>
        </header>
      ) : (
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Exercise overview</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {definition.scenario.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {definition.organization} · {definition.audience} · {definition.durationMinutes} minutes
          </p>
        </header>
      )}

      {isCustom ? (
        <div className="space-y-5">
          {overviewImage && (
            <ExerciseOverviewVisual
              src={overviewImage}
              alt={`${definition.organization} exercise overview`}
            />
          )}
          <p className="whitespace-pre-line text-justify text-sm leading-7 text-muted-foreground sm:text-base">
            {definition.scenario.initialSituation}
          </p>
          {definition.objectives && definition.objectives.length > 0 && (
            <section className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <h2 className="font-semibold text-foreground">Exercise objectives</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {definition.objectives.map((objective) => <li key={objective}>{objective}</li>)}
              </ul>
            </section>
          )}
          {definition.exerciseBoundary && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
              <span className="font-semibold">Exercise boundaries: </span>
              {definition.exerciseBoundary}
            </p>
          )}
        </div>
      ) : isZechl ? (
        <section
          className="rounded-2xl border border-border/70 bg-card px-4 py-1 shadow-sm sm:px-5"
          aria-label="Scenario overview"
        >
          {overviewParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-justify text-[13px] leading-6 text-foreground sm:text-[14px] sm:leading-7 ${
                index < overviewParagraphs.length - 1 ? 'pb-1' : ''
              }`}
            >
              {paragraph}
            </p>
          ))}
        </section>
      ) : (
        <>
          <ExerciseOverviewVisual
            src={definition.organization === 'Mimosa Mine' ? '/Overview Image.jpg' : '/images/inject0.png'}
            alt={definition.organization === 'Mimosa Mine' ? 'Aerial view of Mimosa Mine' : 'Illustrative exercise scenario'}
          />
          <p className="max-w-4xl text-justify text-sm leading-7 text-muted-foreground sm:text-base">
            {definition.scenario.initialSituation}
          </p>
        </>
      )}

    </div>
  )
}

export function ExerciseSessionFlow({ definition }: ExerciseOverviewProps) {
  const sessionFlow = definition.sessionFlow ?? []

  return (
    <section className="space-y-4" aria-labelledby="session-flow-heading">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 id="session-flow-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Session flow
          </h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {sessionFlow.length} stages · {definition.durationMinutes} minutes
        </span>
      </header>
      <ol className="space-y-3">
        {sessionFlow.map((step, index) => (
          <li key={`${step.time}-${step.activity}`} className="flex gap-3">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              {index < sessionFlow.length - 1 && (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4">
              <p className="text-xs font-semibold text-primary">{step.time}</p>
              <p className="mt-1 text-justify text-sm font-medium leading-relaxed text-foreground">
                {step.activity}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ExerciseClosing({ definition }: ExerciseOverviewProps) {
  const isZechl = definition.id === 'zechl'
  const isCustom = definition.id.startsWith('custom-')
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Closing debrief</h1>
        <p className="text-sm text-muted-foreground">
          {definition.organization} · {definition.audience}
        </p>
      </header>
      {isCustom && (definition.scenario.overviewImageUrl || definition.organizationImageUrl) ? (
        <ExerciseOverviewVisual
          src={definition.scenario.overviewImageUrl ?? definition.organizationImageUrl ?? ''}
          alt={`${definition.organization} exercise overview`}
        />
      ) : !isZechl && !isCustom ? (
        <ExerciseOverviewVisual
          src={definition.organization === 'Mimosa Mine' ? '/Overview Image.jpg' : '/images/inject0.png'}
          alt={definition.organization === 'Mimosa Mine' ? 'Aerial view of Mimosa Mine' : 'Illustrative exercise scenario'}
        />
      ) : null}
      <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Reflection questions</h2>
        <ul className="list-disc space-y-2 pl-5 text-justify text-sm leading-relaxed text-muted-foreground">
          {definition.closingQuestions?.map((question) => <li key={question}>{question}</li>)}
        </ul>
      </section>
    </div>
  )
}
