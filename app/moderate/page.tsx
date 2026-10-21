'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Minus, XCircle } from 'lucide-react'
import { INJECTS, ROLES } from '@/lib/exercise-data'
import { ExerciseOverviewVisual, InjectVisual } from '@/components/inject-visual'
import { useExercise } from '@/lib/exercise-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  const { state } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)
  const [selectedInjectId, setSelectedInjectId] = useState(state.activeInjectId ?? INJECTS[0].id)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)

  useEffect(() => {
    if (state.activeInjectId) setSelectedInjectId(state.activeInjectId)
  }, [state.activeInjectId])

  const selectedInject = INJECTS.find((inject) => inject.id === selectedInjectId) ?? INJECTS[0]

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
            role: ROLES.find((item) => item.id === participant?.roleId)?.title ?? 'Role unavailable',
            choiceLabel: choice?.label ?? 'Choice no longer available',
          }
        }),
    }))
  }, [selectedInject, state.participants, state.responses])

  const selectedGroup = responsesByOutcome.find((group) => group.type === selectedOutcome)
  const injectResponseCount = responsesByOutcome.reduce((total, group) => total + group.responses.length, 0)

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            {activeInject ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="text-justify text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
                <InjectVisual injectId={activeInject.id} title={activeInject.title} />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Overview</p>
                <ExerciseOverviewVisual />
                <p className="text-justify text-sm leading-relaxed text-muted-foreground">It is 09:14 AM on a Tuesday morning. Mutinta Banda, a senior accountant in the Finance department at Meridian Financial Group, receives an email that looks like it is from a vendor the company already works with. The subject line reads “Updated Q3 Invoice – Action Required,” and it includes an attached spreadsheet. Mutinta opens the attachment. A pop-up tells her she needs to click a button to view the file properly, so she does without realizing it, that click quietly installs harmful software on her computer. Within minutes, an attacker has a foothold on her machine and starts exploring the rest of the company's network from there. Over the next hour, what started as one employee opening one email escalates into a company-wide ransomware attack that knocks out the finance department's file server and disrupts business across the organization.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Participant responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3">
              <span className="text-sm font-medium">Total participants</span>
              <Badge variant="secondary">{state.participants.length}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3">
              <span className="text-sm font-medium">Total responses for this inject</span>
              <Badge variant="secondary">{injectResponseCount}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {responsesByOutcome.map((group) => {
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
              {INJECTS.map((inject) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
