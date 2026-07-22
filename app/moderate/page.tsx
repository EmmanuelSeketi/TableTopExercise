'use client'

import { useMemo } from 'react'
import { BarChart3, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { INJECTS } from '@/lib/exercise-data'
import { useExercise } from '@/lib/exercise-store'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CHART_MAX = 15

export default function ModeratePage() {
  const { state } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)

  const responseStats = useMemo(() => {
    const correct = state.responses.filter((r) => {
      const inject = INJECTS.find((inj) => inj.id === r.injectId)
      const choice = inject?.choices.find((c) => c.id === r.choice)
      return choice?.type === 'correct'
    }).length
    const neutral = state.responses.filter((r) => {
      const inject = INJECTS.find((inj) => inj.id === r.injectId)
      const choice = inject?.choices.find((c) => c.id === r.choice)
      return choice?.type === 'neutral'
    }).length
    const wrong = state.responses.filter((r) => {
      const inject = INJECTS.find((inj) => inj.id === r.injectId)
      const choice = inject?.choices.find((c) => c.id === r.choice)
      return choice?.type === 'wrong'
    }).length
    return { correct, neutral, wrong, total: state.responses.length }
  }, [state.responses])

  const injectResponseStats = useMemo(() => {
    return INJECTS.map((inject) => {
      const injectResponses = state.responses.filter((r) => r.injectId === inject.id)
      const correct = injectResponses.filter((r) => {
        const choice = inject.choices.find((c) => c.id === r.choice)
        return choice?.type === 'correct'
      }).length
      const neutral = injectResponses.filter((r) => {
        const choice = inject.choices.find((c) => c.id === r.choice)
        return choice?.type === 'neutral'
      }).length
      const wrong = injectResponses.filter((r) => {
        const choice = inject.choices.find((c) => c.id === r.choice)
        return choice?.type === 'wrong'
      }).length
      return {
        id: inject.id,
        title: inject.title,
        time: inject.time,
        correct,
        neutral,
        wrong,
        total: injectResponses.length,
      }
    })
  }, [state.responses])

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-center rounded-lg bg-[#03262c] p-4 sm:p-6">
        <img
          src="/celium-logo.png"
          alt="Celium — The Data Protection Symposium 2024"
          className="h-auto w-full max-w-xl"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0a5763]">Active inject control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {activeInject ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">No active inject selected.</p>
                <p className="text-sm leading-relaxed text-muted-foreground">Select an inject below to make it visible to participants and the projector.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#8a6a35]">Participants Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between border border-border/70 bg-card p-3">
              <span className="text-sm font-medium">Total participants</span>
              <Badge variant="secondary">{state.participants.length}</Badge>
            </div>
            <div className="flex items-center justify-between border border-border/70 bg-card p-3">
              <span className="text-sm font-medium">Total responses</span>
              <Badge variant="secondary">{responseStats.total}</Badge>
            </div>

            <div className="border border-border/70 bg-card p-4">
              <p className="text-sm font-medium mb-3">Analytics By Choice</p>
              <div className="flex h-48">
                <div className="flex w-10 shrink-0 flex-col-reverse justify-between border-r border-foreground/40 pr-1 text-right">
                  {Array.from({ length: CHART_MAX + 1 }, (_, value) => (
                    <span key={value} className="text-[9px] leading-none text-muted-foreground">
                      {value}
                    </span>
                  ))}
                </div>
                <div className="flex flex-1 items-end justify-between gap-2 border-b border-foreground/40 pl-2">
                  <div className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-semibold text-emerald-400">{responseStats.correct}</span>
                    <div
                      className="w-full max-w-10 bg-emerald-500/80"
                      style={{ height: `${Math.max((responseStats.correct / Math.max(responseStats.total, 1)) * 100, 4)}%` }}
                    />
                  </div>
                  <div className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-semibold text-amber-400">{responseStats.neutral}</span>
                    <div
                      className="w-full max-w-10 bg-amber-500/80"
                      style={{ height: `${Math.max((responseStats.neutral / Math.max(responseStats.total, 1)) * 100, 4)}%` }}
                    />
                  </div>
                  <div className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-semibold text-red-400">{responseStats.wrong}</span>
                    <div
                      className="w-full max-w-10 bg-red-500/80"
                      style={{ height: `${Math.max((responseStats.wrong / Math.max(responseStats.total, 1)) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex mt-2">
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="size-3" /> Correct
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400">
                    <Minus className="size-3" /> Neutral
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-red-400">
                    <XCircle className="size-3" /> Wrong
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}