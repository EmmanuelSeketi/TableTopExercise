'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ManagementAction = 'edit' | 'delete'

export function ExerciseManagementMenu({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string
  exerciseName: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [action, setAction] = useState<ManagementAction | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function chooseAction(nextAction: ManagementAction) {
    setAction(nextAction)
    setMenuOpen(false)
    setPassword('')
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!action || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const loginResult = (await loginResponse.json()) as { error?: string }
      if (!loginResponse.ok) throw new Error(loginResult.error ?? 'Facilitator verification failed.')

      if (action === 'edit') {
        window.location.assign(`/create-exercise?edit=${encodeURIComponent(exerciseId)}`)
        return
      }

      const deleteResponse = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'DELETE',
      })
      const deleteResult = (await deleteResponse.json()) as { error?: string }
      if (!deleteResponse.ok) throw new Error(deleteResult.error ?? 'Exercise could not be deleted.')
      window.location.reload()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Exercise could not be managed.')
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Manage ${exerciseName}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="size-10 rounded-full bg-background shadow-sm"
      >
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </Button>

      {menuOpen && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => chooseAction('edit')}
          >
            <Pencil aria-hidden="true" className="size-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            onClick={() => chooseAction('delete')}
          >
            <Trash2 aria-hidden="true" className="size-4" /> Delete
          </button>
        </div>
      )}

      {action && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !submitting) setAction(null)
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setAction(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`manage-title-${exerciseId}`}
            aria-describedby={`manage-description-${exerciseId}`}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl"
          >
            <h2 id={`manage-title-${exerciseId}`} className="text-lg font-semibold">
              {action === 'edit' ? 'Verify facilitator access' : 'Delete exercise'}
            </h2>
            <p id={`manage-description-${exerciseId}`} className="mt-2 text-sm text-muted-foreground">
              {action === 'edit'
                ? `Enter the facilitator password to edit ${exerciseName}.`
                : `${exerciseName} will be removed from the exercise list. Existing response records will be retained.`}
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label htmlFor={`manage-password-${exerciseId}`} className="text-sm font-medium">
                  Facilitator password
                </label>
                <Input
                  id={`manage-password-${exerciseId}`}
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAction(null)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant={action === 'delete' ? 'destructive' : 'default'} disabled={submitting}>
                  {submitting ? 'Verifying...' : action === 'edit' ? 'Continue to edit' : 'Verify and delete'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
