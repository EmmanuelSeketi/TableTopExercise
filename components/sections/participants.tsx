'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useExercise } from '@/lib/exercise-store'
import { ROLES } from '@/lib/exercise-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const DEVICE_ID_KEY = 'cyber-exercise-device-id'

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

interface ParticipantsSectionProps {
  onContinue?: () => void
}

export function ParticipantsSection({ onContinue }: ParticipantsSectionProps) {
  const { addParticipant } = useExercise()
  const [name, setName] = useState('')
  const [roleId, setRoleId] = useState(ROLES[0]?.id ?? 'incident-commander')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  const canSubmit = name.trim().length > 0 && roleId.length > 0 && deviceId != null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !deviceId || joining) return
    
    setJoining(true)
    try {
      const secret = process.env.NEXT_PUBLIC_EXERCISE_API_SECRET
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret) headers['x-api-secret'] = secret
      
      const response = await fetch('/api/exercise-state/join', {
        method: 'POST',
        headers,
        body: JSON.stringify({ deviceId, name: name.trim(), roleId }),
      })
      
      if (response.ok) {
        addParticipant({ deviceId, name: name.trim(), roleId })
        setName('')
        if (onContinue) {
          onContinue()
        }
      }
    } catch {
      // ignore join failures
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
            <p className="text-sm leading-relaxed text-muted-foreground">
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
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-[#0a5763] focus-visible:ring-3 focus-visible:ring-[#0a5763]/40"
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3 sm:col-span-2">
              <Button type="submit" className="gap-2 bg-[#0a5763] text-white hover:bg-[#0a5763]/80 focus-visible:ring-[#0a5763]/50" disabled={!canSubmit || joining}>
                <UserPlus className="size-4" /> {joining ? 'Joining...' : 'Join exercise'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
