'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useExercise } from '@/lib/exercise-store'
import { ROLES } from '@/lib/exercise-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ParticipantsSectionProps {
  onContinue?: () => void
}

export function ParticipantsSection({ onContinue }: ParticipantsSectionProps) {
  const { addParticipant, setSyncError } = useExercise()
  const [name, setName] = useState('')
  const [roleId, setRoleId] = useState(ROLES[0]?.id ?? 'incident-commander')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && roleId.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || joining) return
    
    setJoining(true)
    setJoinError(null)
    try {
      const response = await fetch('/api/exercise-state/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), roleId }),
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(result?.error ?? `Participant registration failed (${response.status})`)
      }

      const result = (await response.json()) as {
        participant: { deviceId: string; name: string; roleId: typeof roleId }
      }
      addParticipant(result.participant)
      setSyncError(null)
      setName('')
      if (onContinue) onContinue()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Participant registration failed'
      setSyncError(message)
      setJoinError(message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Participant registration</p>
            <p className="text-justify text-sm leading-relaxed text-muted-foreground">
              Join the exercise by choosing a role. The facilitator can review the current role poll below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-1.5">
              <label htmlFor="participant-name" className="text-sm font-medium text-foreground">
                Your name
              </label>
              <Input
                id="participant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="participant-role" className="text-sm font-medium text-foreground">
                Choose a role
              </label>
              <select
                id="participant-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value as typeof roleId)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40"
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3 sm:col-span-2">
              <Button type="submit" className="gap-2" disabled={!canSubmit || joining}>
                <UserPlus className="size-4" /> {joining ? 'Joining...' : 'Join exercise'}
              </Button>
            </div>
          </form>
          {joinError && <p role="alert" className="text-sm text-destructive">{joinError}</p>}
        </CardContent>
      </Card>

    </div>
  )
}
