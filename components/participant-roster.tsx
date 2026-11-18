'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useExerciseDefinition } from '@/lib/exercise-selection'
import type { Participant } from '@/lib/exercise-store'

interface ParticipantRosterProps {
  participants: Participant[]
  id: string
}

export function ParticipantRoster({ participants, id }: ParticipantRosterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { roles } = useExerciseDefinition()
  const sortedParticipants = [...participants].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3 text-left transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-sm font-medium">Total participants</span>
        <span className="flex items-center gap-2">
          <Badge variant="secondary">{participants.length}</Badge>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      <div
        id={id}
        hidden={!isOpen}
        className="rounded-xl border border-border/70 bg-muted/30 p-3"
      >
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Participants ({participants.length})
        </h3>
        {sortedParticipants.length > 0 ? (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {sortedParticipants.map((participant) => (
              <li
                key={participant.id}
                className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-foreground">{participant.name}</span>
                <span className="text-sm text-muted-foreground">
                  {roles.find((role) => role.id === participant.roleId)?.title ?? 'Role unavailable'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            No participants have joined yet.
          </p>
        )}
      </div>
    </div>
  )
}
