'use client'

import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { INJECTS, ROLES } from '@/lib/exercise-data'
import { useExercise } from '@/lib/exercise-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InjectVisual } from '@/components/inject-visual'

const ROLE_CHART_COLORS = [
  '#142B4A',
  '#c9a76b',
  '#0a5763',
  '#8a6a35',
  '#3fa7b8',
  '#e4cf9c',
  '#123b42',
  '#a98a4e',
]

export default function FacilitatorPage() {
  const { state, setActiveInject, resetAll, hydrated, toggleInject } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)

  const roleCounts = useMemo(() => {
    return state.participants.reduce<Record<string, number>>((acc, participant) => {
      acc[participant.roleId] = (acc[participant.roleId] ?? 0) + 1
      return acc
    }, {})
  }, [state.participants])

  const maxRoleCount = useMemo(() => {
    return Math.max(...Object.values(roleCounts), 1)
  }, [roleCounts])

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Loading exercise data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Active inject control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {activeInject ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <span className="text-lg font-semibold text-foreground">{activeInject.title}</span>
                </div>
                <p className="text-justify text-sm leading-relaxed text-muted-foreground">{activeInject.description}</p>
                <InjectVisual injectId={activeInject.id} title={activeInject.title} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setActiveInject(null)}>
                    Deactivate inject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">No active inject selected.</p>
                <p className="text-justify text-sm leading-relaxed text-muted-foreground">Select an inject below to make it visible to participants and the projector.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Signup status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-justify text-sm leading-relaxed text-muted-foreground">Participant registrations are updated live via local storage and cross-tab sync.</p>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3">
              <span className="text-sm font-medium">Total participants</span>
              <Badge variant="secondary">{state.participants.length}</Badge>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
              <div className="space-y-3">
                {ROLES.map((role, index) => {
                  const count = roleCounts[role.id] ?? 0
                  const widthPct = maxRoleCount > 0 ? (count / maxRoleCount) * 100 : 0
                  const color = ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]
                  return (
                    <div key={role.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{role.title}</span>
                        <span className="text-xs text-muted-foreground">{count} joined</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(widthPct, count > 0 ? 8 : 0)}%`,
                            backgroundColor: color,
                          }}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Inject list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {INJECTS.map((inject) => {
            const isActive = state.activeInjectId === inject.id
            const isCompleted = state.completedInjects.includes(inject.id)
            return (
              <div key={inject.id} className={`grid gap-3 rounded-xl border border-border/70 p-4 transition-colors sm:grid-cols-[1fr_auto] ${isActive ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}>
                <div>
                  <p className="font-semibold text-foreground">{inject.title}</p>
                  <p className="text-sm text-muted-foreground">{inject.time} · {inject.nist}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isActive ? <Badge variant="success">Active</Badge> : null}
                  {isCompleted ? <Badge variant="secondary">Completed</Badge> : null}
                  <Button variant={isActive ? 'secondary' : 'default'} size="sm" onClick={() => setActiveInject(isActive ? null : inject.id)}>
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant={isCompleted ? 'ghost' : 'secondary'} size="sm" onClick={() => toggleInject(inject.id)}>
                    {isCompleted ? 'Undo complete' : 'Mark complete'}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Reset exercise data</p>
          <p className="text-justify text-sm leading-relaxed text-muted-foreground">
            Clears participant responses, registrations, and exercise progress.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={resetAll}
          className="h-11 w-full gap-2 border border-destructive bg-destructive px-5 text-destructive-foreground shadow-sm hover:bg-destructive/90 sm:w-auto"
        >
          <RotateCcw className="size-4" />
          Reset exercise data
        </Button>
      </div>
    </div>
  )
}