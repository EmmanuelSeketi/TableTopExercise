'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseBrand } from '@/components/exercise-brand'

export default function ProjectedPage() {
  const [signupUrl, setSignupUrl] = useState('')

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    if (!appUrl) return
    setSignupUrl(`${appUrl.replace(/\/$/, '')}/signup`)
  }, [])

  const qrCodeUrl = signupUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(signupUrl)}`
    : ''

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ExerciseBrand />

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0a5763]">Join the exercise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR code for signup"
              className="h-60 w-60 border border-border/70 bg-white p-3"
            />
          ) : (
            <div
              role="status"
              className="flex h-60 w-60 items-center justify-center border border-border/70 bg-white p-3 text-sm text-muted-foreground"
            >
              Preparing signup QR code...
            </div>
          )}
          <p className="text-sm font-medium text-foreground">Scan to Join</p>
        </CardContent>
      </Card>
    </div>
  )
}