'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AdminSessionControls() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function signOut() {
    setError(null)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error(`Sign out failed (${response.status})`)
      const next = `${window.location.pathname}${window.location.search}`
      router.replace(`/login?next=${encodeURIComponent(next)}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign out failed')
    }
  }

  return (
    <div className="no-print mx-auto flex w-full max-w-[90rem] items-center justify-end gap-3 px-4 pt-4 sm:px-6 lg:px-8">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
    </div>
  )
}
