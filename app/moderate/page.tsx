'use client'

import { useMemo } from 'react'
import { BarChart3, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { INJECTS } from '@/lib/exercise-data'
import { useExercise } from '@/lib/exercise-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  const maxCount = useMemo(() => Math.max(responseStats.correct, responseStats.neutral, responseStats.wrong, 1), [responseStats])

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
              <p className="text-sm font-medium mb-4">Analytics By Choice</p>
              <div className="space-y-3">
                {[
                  { label: 'Correct', count: responseStats.correct, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: CheckCircle2 },
                  { label: 'Neutral', count: responseStats.neutral, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Minus },
                  { label: 'Wrong', count: responseStats.wrong, color: 'bg-red-500', textColor: 'text-red-400', icon: XCircle },
                ].map((item) => {
                  const widthPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4 ${item.textColor}`} />
                          <span className="font-medium text-foreground">{item.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden bg-muted">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${Math.max(widthPct, item.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}