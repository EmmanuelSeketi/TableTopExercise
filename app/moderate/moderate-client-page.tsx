'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, MessageSquareText, Minus, XCircle } from 'lucide-react'
import { useExerciseDefinition } from '@/lib/exercise-selection'
import {
  ExerciseClosing,
  ExerciseOverview,
  ExerciseSessionFlow,
} from '@/components/exercise-overview'
import { InjectVisual } from '@/components/inject-visual'
import { ParticipantRoster } from '@/components/participant-roster'
import { useExercise } from '@/lib/exercise-store'
import { getCurrentExerciseStep } from '@/lib/exercise-navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const RESPONSE_TYPES = [
  {
    type: 'correct',
    label: 'Correct',
    icon: CheckCircle2,
    color: 'text-[#557C62] dark:text-[#A8C7AF]',
    selected: 'border-[#7FA58A] bg-[#7FA58A]/10',
  },
  {
    type: 'wrong',
    label: 'Wrong',
    icon: XCircle,
    color: 'text-[#A96056] dark:text-[#D9948B]',
    selected: 'border-[#C98278] bg-[#C98278]/10',
  },
  {
    type: 'neutral',
    label: 'Neutral',
    icon: Minus,
    color: 'text-slate-600 dark:text-slate-300',
    selected: 'border-slate-400/70 bg-slate-500/10',
  },
] as const

export default function ModeratePage() {
  const { state, setActiveInject } = useExercise()
  const definition = useExerciseDefinition()
  const { injects, roles } = definition
  const { steps: exerciseSteps, index: activeStepIndex, step: activeStep } =
    getCurrentExerciseStep(definition, state.activeInjectId)
  const activeInject = activeStep.kind === 'inject' ? activeStep.inject : undefined
  const [selectedInjectId, setSelectedInjectId] = useState(state.activeInjectId ?? injects[0].id)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [discussionOpen, setDiscussionOpen] = useState(false)
  const [discussionPointIndex, setDiscussionPointIndex] = useState(0)

  useEffect(() => {
    if (activeStep.kind === 'inject') setSelectedInjectId(activeStep.id)
    setDiscussionOpen(false)
    setDiscussionPointIndex(0)
  }, [state.activeInjectId, activeStep.id, activeStep.kind])

  const selectedInject = injects.find((inject) => inject.id === selectedInjectId) ?? injects[0]

  const responsesByOutcome = useMemo(() => {
    const participantsByDeviceId = new Map(
      state.participants.map((participant) => [participant.deviceId, participant]),
    )

    const injectResponses = state.responses.filter((response) => response.injectId === selectedInject.id)

    return RESPONSE_TYPES.map((responseType) => ({
      ...responseType,
      responses: injectResponses
        .filter((response) => {
          const choice = selectedInject.choices.find((item) => item.id === response.choice)
          return choice?.type === responseType.type
        })
        .map((response) => {
          const participant = participantsByDeviceId.get(response.participantId)
          const choice = selectedInject.choices.find((item) => item.id === response.choice)
          return {
            ...response,
            name: participant?.name ?? 'Registration unavailable',
            role: participant?.customRole ?? roles.find((item) => item.id === participant?.roleId)?.title ?? 'Role unavailable',
            choiceLabel: choice?.label ?? 'Choice no longer available',
          }
        }),
    }))
  }, [selectedInject, state.participants, state.responses])

  const selectedGroup = responsesByOutcome.find((group) => group.type === selectedOutcome)
  const injectResponseCount = responsesByOutcome.reduce((total, group) => total + group.responses.length, 0)

  function activateStep(index: number) {
    const step = exerciseSteps[index]
    if (!step) return
    setActiveInject(step.id)
    if (step.kind === 'inject') setSelectedInjectId(step.id)
    setSelectedOutcome(null)
  }

  const discussionPoints = activeInject?.discussionPoints ?? []

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 pb-6 pt-2 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            {activeInject ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="whitespace-pre-line text-justify text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
                <InjectVisual injectId={activeInject.id} title={activeInject.title} />
                {discussionPoints.length > 0 && (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      aria-expanded={discussionOpen}
                      onClick={() => setDiscussionOpen((open) => !open)}
                    >
                      <MessageSquareText className="size-4" />
                      {discussionOpen ? 'Hide discussion' : 'Show discussion'}
                    </Button>
                    {discussionOpen && (
                      <section className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-sm font-semibold text-foreground">
                            {discussionPoints[discussionPointIndex]?.role}
                          </h2>
                          <div className="flex items-center gap-1.5" aria-label="Choose discussion point">
                            {discussionPoints.map((_, index) => (
                              <Button
                                key={index}
                                type="button"
                                size="sm"
                                variant={discussionPointIndex === index ? 'default' : 'outline'}
                                aria-label={`Show discussion point ${index + 1}`}
                                aria-pressed={discussionPointIndex === index}
                                onClick={() => setDiscussionPointIndex(index)}
                              >
                                {index + 1}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground" aria-live="polite">
                          {discussionPoints[discussionPointIndex]?.prompt}
                        </p>
                      </section>
                    )}
                  </div>
                )}
              </div>
            ) : activeStep.kind === 'session-flow' ? (
              <ExerciseSessionFlow definition={definition} />
            ) : activeStep.kind === 'closing' ? (
              <ExerciseClosing definition={definition} />
            ) : (
              <ExerciseOverview definition={definition} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Participant responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <ParticipantRoster participants={state.participants} id="moderate-participants" />
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3">
              <span className="text-sm font-medium">Total responses for this inject</span>
              <Badge variant="secondary">{injectResponseCount}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {responsesByOutcome.filter((group) => group.type !== 'neutral').map((group) => {
                const Icon = group.icon
                const isSelected = selectedOutcome === group.type
                return (
                  <button
                    key={group.type}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedOutcome(isSelected ? null : group.type)}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-xl border border-border/70 bg-card p-3 text-center transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? group.selected : ''}`}
                  >
                    <span className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${group.color}`}>
                      <Icon className="size-4" />
                      {group.label}
                    </span>
                    <span className="text-xl font-bold text-foreground">{group.responses.length}</span>
                  </button>
                )
              })}
            </div>

            <select
              id="response-inject"
              aria-label="Select inject for responses"
              value={selectedInject.id}
              onChange={(event) => {
                setSelectedInjectId(event.target.value)
                setSelectedOutcome(null)
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40"
            >
              {injects.map((inject) => (
                <option key={inject.id} value={inject.id}>
                  {inject.order}. {inject.title}
                </option>
              ))}
            </select>

            {selectedGroup && (
              <section className="space-y-3 border-t border-border/70 pt-4" aria-live="polite">
                <h3 className={`text-sm font-semibold ${selectedGroup.color}`}>
                  {selectedGroup.label} responses ({selectedGroup.responses.length})
                </h3>
                {selectedGroup.responses.length > 0 ? (
                  <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                    {selectedGroup.responses.map((response) => (
                      <li key={response.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{response.name}</p>
                            <p className="text-sm text-muted-foreground">{response.role}</p>
                          </div>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={new Date(response.submittedAt).toISOString()}
                          >
                            {new Date(response.submittedAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-2 text-justify text-sm leading-relaxed text-foreground">
                          {response.choiceLabel}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    No {selectedGroup.label.toLowerCase()} responses for this inject yet.
                  </p>
                )}
              </section>
            )}
            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex gap-2 sm:ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  disabled={activeStepIndex <= 0}
                  onClick={() => activateStep(activeStepIndex - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  disabled={activeStepIndex >= exerciseSteps.length - 1}
                  onClick={() => activateStep(activeStepIndex + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
