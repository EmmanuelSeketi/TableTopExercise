'use client'

import { useMemo } from 'react'
import { INJECTS, ROLES } from '@/lib/exercise-data'
import { useExercise } from '@/lib/exercise-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ROLE_CHART_COLORS = [
  '#007A8E', // teal (brand primary)
  '#c9a76b', // gold (brand accent)
  '#0a5763', // deep teal
  '#8a6a35', // bronze
  '#3fa7b8', // light teal
  '#e4cf9c', // pale gold
  '#123b42', // near-black teal
  '#a98a4e', // muted gold
]

const CHART_MAX = 15

export default function FacilitatorPage() {
  const { state, setActiveInject, toggleInject } = useExercise()
  const activeInject = INJECTS.find((inject) => inject.id === state.activeInjectId)

  const roleCounts = useMemo(() => {
    return state.participants.reduce<Record<string, number>>((acc, participant) => {
      acc[participant.roleId] = (acc[participant.roleId] ?? 0) + 1
      return acc
    }, {})
  }, [state.participants])

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
              <div className="flex h-48">
                {/* Y axis */}
                <div className="flex w-10 shrink-0 flex-col-reverse justify-between border-r border-foreground/40 pr-1 text-right">
                  {Array.from({ length: CHART_MAX + 1 }, (_, value) => (
                    <span key={value} className="text-[9px] leading-none text-muted-foreground">
                      {value}
                    </span>
                  ))}
                </div>
                {/* Plot area */}
                <div className="flex flex-1 items-end justify-between gap-2 border-b border-foreground/40 pl-2">
                  {ROLES.map((role, index) => {
                    const count = roleCounts[role.id] ?? 0
                    const heightPct = (Math.min(count, CHART_MAX) / CHART_MAX) * 100
                    return (
                      <div key={role.id} className="flex h-full flex-1 flex-col items-center justify-end">
                        <span className="mb-1 text-xs font-semibold text-foreground">{count}</span>
                        <div
                          className="w-full max-w-10 transition-all"
                          style={{
                            height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`,
                            backgroundColor: ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length],
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* X axis category names */}
              <div className="flex pl-12">
                {ROLES.map((role) => (
                  <span key={role.id} className="flex-1 text-center text-[11px] leading-tight text-muted-foreground">
                    {role.title}
                  </span>
                ))}
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
    </div>
  )
}