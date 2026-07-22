'use client'

import { useMemo } from 'react'
import { INJECTS, ROLES } from '@/lib/exercise-data'
import { useExercise } from '@/lib/exercise-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ROLE_CHART_COLORS = [
  '#007A8E',
  '#c9a76b',
  '#0a5763',
  '#8a6a35',
  '#3fa7b8',
  '#e4cf9c',
  '#123b42',
  '#a98a4e',
]

export default function FacilitatorPage() {
  const { state, setActiveInject, resetAll, hydrated } = useExercise()
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
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center rounded-lg bg-[#03262c] p-4 sm:p-6">
          <img
            src="/celium-logo.png"
            alt="Celium — The Data Protection Symposium 2024"
            className="h-auto w-full max-w-xl"
          />
        </div>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Loading exercise data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setActiveInject(null)}>
                    Deactivate inject
                  </Button>
                </div>
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
            <CardTitle className="text-[#8a6a35]">Signup status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">Participant registrations are updated live via local storage and cross-tab sync.</p>
            <div className="flex items-center justify-between border border-border/70 bg-card p-3">
              <span className="text-sm font-medium">Total participants</span>
              <Badge variant="secondary">{state.participants.length}</Badge>
            </div>
            <div className="border border-border/70 bg-card p-4">
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
                      <div className="h-2 w-full overflow-hidden bg-muted">
                        <div
                          className="h-full transition-all"
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
          <CardTitle className="text-[#0a5763]">Inject list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {INJECTS.map((inject) => {
            const isActive = state.activeInjectId === inject.id
            const isCompleted = state.completedInjects.includes(inject.id)
            return (
              <div key={inject.id} className="grid gap-3 border border-border/70 bg-card p-4 sm:grid-cols-[1fr_auto]">
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

      <Button variant="destructive" onClick={resetAll} className="w-full">
        Reset exercise data
      </Button>
    </div>
  )
}