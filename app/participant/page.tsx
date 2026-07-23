'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Minus } from 'lucide-react'
import { useExercise } from '@/lib/exercise-store'
import { INJECTS } from '@/lib/exercise-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const DEVICE_ID_KEY = 'cyber-exercise-device-id'

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

export default function ParticipantPage() {
  const { state, submitResponse } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  const prevActiveInjectIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevActiveInjectIdRef.current !== state.activeInjectId) {
      prevActiveInjectIdRef.current = state.activeInjectId
      setSelectedChoiceId(null)
      setSubmitted(false)
    }
  }, [state.activeInjectId])

  const selectedChoice = activeInject?.choices.find((c) => c.id === selectedChoiceId) ?? null
  const selectedType = selectedChoice?.type ?? null

  const hasExistingResponse = deviceId != null && activeInject != null
    ? state.responses.some((r) => r.participantId === deviceId && r.injectId === activeInject.id)
    : false

  const existingResponse = activeInject && deviceId
    ? state.responses.find((r) => r.participantId === deviceId && r.injectId === activeInject.id)
    : undefined

  const existingChoice = activeInject && existingResponse
    ? activeInject.choices.find((c) => c.id === existingResponse.choice)
    : undefined

  const handleSubmit = () => {
    if (!selectedChoiceId || !activeInject || !deviceId) return
    submitResponse(deviceId, activeInject.id, selectedChoiceId)
    setSubmitted(true)
  }

  const resultConfig = (submitted || hasExistingResponse) && (selectedType || existingChoice?.type)
    ? {
        correct: {
          label: 'Correct answer',
          className: 'border-emerald-500 bg-emerald-500/20 text-black dark:text-white',
          icon: <CheckCircle2 className="size-4 text-emerald-400" />,
        },
        neutral: {
          label: 'Neutral Answer',
          className: 'border-amber-500 bg-amber-500/10 text-black dark:text-white',
          icon: <Minus className="size-4 text-amber-400" />,
        },
        wrong: {
          label: 'Wrong answer',
          className: 'border-red-500 bg-red-500/10 text-black dark:text-white',
          icon: <XCircle className="size-4 text-red-400" />,
        },
      }[selectedType ?? existingChoice?.type ?? 'wrong']
    : null

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-center rounded-lg bg-[#03262c] p-4 sm:p-6">
        <img
          src="/celium-logo.png"
          alt="Celium — The Data Protection Symposium 2024"
          className="h-auto w-full max-w-xl"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0a5763]">Participant view</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          {activeInject ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#007A8E]">
                  {activeInject.phase}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
              </div>

              <div className="border border-border/70 bg-card p-4">
                <p className="text-sm font-medium mb-3">What does the team do?</p>
                <div className="space-y-2">
                  {activeInject.choices.map((choice) => {
                    const isSelected = selectedChoiceId === choice.id
                    const isExisting = hasExistingResponse && existingChoice?.id === choice.id
                    const isCorrect = choice.type === 'correct'
                    const isNeutral = choice.type === 'neutral'
                    const isWrong = choice.type === 'wrong'

                    let buttonClass =
                      'border-border/70 bg-card text-foreground hover:border-[#007A8E]/60 hover:bg-[#007A8E]/5'

                    if (isExisting || submitted) {
                      if (isCorrect) buttonClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-50'
                      else if (isNeutral) buttonClass = 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-50'
                      else if (isWrong) buttonClass = 'border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-50'
                    } else if (isSelected) {
                      buttonClass = 'border-[#007A8E] bg-[#007A8E]/10 text-foreground'
                    }

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={submitted || hasExistingResponse}
                        onClick={() => setSelectedChoiceId(choice.id)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center justify-between gap-3 border px-4 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed ${buttonClass}`}
                      >
                        <span>{choice.label}</span>
                        {(submitted || hasExistingResponse) && isExisting && resultConfig?.icon}
                      </button>
                    )
                  })}
                </div>

                {submitted || hasExistingResponse ? (
                  <div className="mt-4 space-y-3">
                    <div className={`border p-3 ${resultConfig?.className ?? 'border-border/70 bg-card'}`}>
                      <div className="flex items-center gap-2">
                        {resultConfig?.icon}
                        <p className="text-sm font-semibold">{resultConfig?.label ?? 'Response recorded'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button className="mt-4 w-full" onClick={handleSubmit} disabled={!selectedChoiceId}>
                    Submit response
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">No active inject selected yet.</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Wait for the facilitator to activate the next inject.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}