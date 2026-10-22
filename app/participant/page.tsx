'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Minus } from 'lucide-react'
import { ExerciseOverviewVisual, InjectVisual } from '@/components/inject-visual'
import { useExercise } from '@/lib/exercise-store'
import { INJECTS } from '@/lib/exercise-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ParticipantPage() {
  const { state, submitResponse } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)
  const participantResponses = state.currentParticipantId
    ? state.responses.filter((response) => response.participantId === state.currentParticipantId)
    : []
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const prevActiveInjectIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevActiveInjectIdRef.current !== state.activeInjectId) {
      prevActiveInjectIdRef.current = state.activeInjectId
      setSelectedChoiceId(null)
      setSubmitted(false)
      setSubmitError(null)
    }
  }, [state.activeInjectId])

  const selectedChoice = activeInject?.choices.find((c) => c.id === selectedChoiceId) ?? null
  const selectedType = selectedChoice?.type ?? null

  const hasExistingResponse = activeInject != null
    ? participantResponses.some((r) => r.injectId === activeInject.id)
    : false

  const existingResponse = activeInject
    ? participantResponses.find((r) => r.injectId === activeInject.id)
    : undefined

  const existingChoice = activeInject && existingResponse
    ? activeInject.choices.find((c) => c.id === existingResponse.choice)
    : undefined

  const handleSubmit = async () => {
    if (!selectedChoiceId || !activeInject || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitResponse(activeInject.id, selectedChoiceId)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your response could not be saved. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resultConfig = (submitted || hasExistingResponse) && (selectedType || existingChoice?.type)
    ? {
        correct: {
          label: 'Correct answer',
          className: 'border-[#7FA58A] bg-[#7FA58A]/15 text-[#355844] dark:text-[#B7D2BF]',
          icon: <CheckCircle2 className="size-4 text-[#557C62] dark:text-[#A8C7AF]" />,
        },
        neutral: {
          label: 'Neutral Answer',
          className: 'border-slate-400/70 bg-slate-500/10 text-slate-700 dark:text-slate-200',
          icon: <Minus className="size-4 text-slate-500 dark:text-slate-300" />,
        },
        wrong: {
          label: 'Wrong answer',
          className: 'border-[#C98278] bg-[#C98278]/12 text-[#8C4F49] dark:text-[#E2A9A1]',
          icon: <XCircle className="size-4 text-[#A96056] dark:text-[#D9948B]" />,
        },
      }[selectedType ?? existingChoice?.type ?? 'wrong']
    : null

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-0 py-4 sm:px-6 sm:py-8 lg:px-8">
      <Card>
        <CardContent className="space-y-5 p-3 sm:space-y-6 sm:p-5">
          {activeInject ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">
                  {activeInject.phase}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="text-justify text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
              </div>

              <InjectVisual injectId={activeInject.id} title={activeInject.title} />

              <div className="rounded-xl border border-border/70 bg-muted/40 p-3 sm:p-5">
                <p className="mb-3 text-sm font-semibold">What does the team do?</p>
                <div className="space-y-2">
                  {activeInject.choices.map((choice) => {
                    const isSelected = selectedChoiceId === choice.id
                    const isExisting = hasExistingResponse && existingChoice?.id === choice.id
                    const isCorrect = choice.type === 'correct'
                    const isNeutral = choice.type === 'neutral'
                    const isWrong = choice.type === 'wrong'

                    let buttonClass =
                      'border-border/70 bg-card text-foreground hover:border-primary/60 hover:bg-primary/5'

                    if (isExisting || submitted) {
                      if (isCorrect) buttonClass = 'border-[#7FA58A] bg-[#7FA58A]/10 text-[#355844] dark:text-[#B7D2BF]'
                      else if (isNeutral) buttonClass = 'border-slate-400/70 bg-slate-500/10 text-slate-700 dark:text-slate-200'
                      else if (isWrong) buttonClass = 'border-[#C98278] bg-[#C98278]/10 text-[#8C4F49] dark:text-[#E2A9A1]'
                    } else if (isSelected) {
                      buttonClass = 'border-primary bg-primary/10 text-foreground'
                    }

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={submitting || submitted || hasExistingResponse}
                        onClick={() => setSelectedChoiceId(choice.id)}
                        aria-pressed={isSelected}
                        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-3 py-4 text-left text-[15px] font-medium leading-relaxed transition disabled:cursor-not-allowed sm:px-4 sm:py-3 sm:text-sm ${buttonClass}`}
                      >
                        <span className="min-w-0 flex-1 text-justify">{choice.label}</span>
                        {(submitted || hasExistingResponse) && isExisting && resultConfig?.icon}
                      </button>
                    )
                  })}
                </div>

                {submitError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">{submitError}</p>
                )}

                {submitted || hasExistingResponse ? (
                  <div className="mt-4 space-y-3">
                    <div className={`rounded-lg border p-3 ${resultConfig?.className ?? 'border-border/70 bg-card'}`}>
                      <div className="flex items-center gap-2">
                        {resultConfig?.icon}
                        <p className="text-sm font-semibold">{resultConfig?.label ?? 'Response recorded'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button className="mt-4 w-full" onClick={handleSubmit} disabled={!selectedChoiceId || submitting}>
                    {submitting ? 'Saving response...' : submitError ? 'Retry submission' : 'Submit response'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Overview</p>
              <ExerciseOverviewVisual />
              <p className="text-justify text-sm leading-relaxed text-muted-foreground">
                It is 09:14 AM  on a Tuesday morning. Mutinta Banda, a senior accountant in the Finance department at Meridian Financial Group, receives an email that looks like it is from a vendor the company already works with. The subject line reads “Updated Q3 Invoice – Action Required,” and it includes an attached spreadsheet.
Mutinta opens the attachment. A pop-up tells her she needs to click a button to view the file properly, so she does. Without realizing it, that click quietly installs harmful software on her computer. Within minutes, an attacker has a foothold on her machine and starts exploring the rest of the company's network from there.
Over the next hour, what started as one employee opening one email escalates into a company-wide ransomware attack that knocks out the finance department's file server and disrupts business across the organization.

              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}