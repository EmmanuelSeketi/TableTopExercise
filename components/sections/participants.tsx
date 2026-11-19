'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useExercise, type Participant } from '@/lib/exercise-store'
import { exerciseApiUrl, useExerciseDefinition } from '@/lib/exercise-selection'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CUSTOM_ROLE_ID = 'custom'

interface ParticipantsSectionProps {
  onContinue?: () => void
}

export function ParticipantsSection({ onContinue }: ParticipantsSectionProps) {
  const { addParticipant, setSyncError } = useExercise()
  const { roles } = useExerciseDefinition()
  const [name, setName] = useState('')
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? 'incident-commander')
  const [customRole, setCustomRole] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    if (roleId !== CUSTOM_ROLE_ID && !roles.some((role) => role.id === roleId)) {
      setRoleId(roles[0]?.id ?? '')
    }
  }, [roles, roleId])

  const normalizedCustomRole = customRole.trim()
  const canSubmit = name.trim().length > 0 && (
    roleId === CUSTOM_ROLE_ID
      ? normalizedCustomRole.length > 0 && normalizedCustomRole.length <= 80
      : roles.some((role) => role.id === roleId)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || joining) return
    
    setJoining(true)
    setJoinError(null)
    try {
      const response = await fetch(exerciseApiUrl('/api/exercise-state/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          roleId,
          ...(roleId === CUSTOM_ROLE_ID ? { customRole: normalizedCustomRole } : {}),
        }),
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(result?.error ?? `Participant registration failed (${response.status})`)
      }

      const result = (await response.json()) as { participant: Participant }
      addParticipant(result.participant)
      setSyncError(null)
      setName('')
      setCustomRole('')
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
              Join by selecting a listed role or entering your own. The facilitator can review participant roles below.
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
                Choose or enter a role
              </label>
              <select
                id="participant-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/40"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
                <option value={CUSTOM_ROLE_ID}>Other (enter your role)</option>
              </select>
            </div>

            {roleId === CUSTOM_ROLE_ID && (
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="participant-custom-role" className="text-sm font-medium text-foreground">
                  Your role
                </label>
                <Input
                  id="participant-custom-role"
                  value={customRole}
                  onChange={(event) => setCustomRole(event.target.value)}
                  placeholder="Enter your role"
                  maxLength={80}
                  required
                />
              </div>
            )}

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
