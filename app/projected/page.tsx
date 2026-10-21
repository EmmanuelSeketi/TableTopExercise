'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectedPage() {
  const [signupUrl, setSignupUrl] = useState('')

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    if (!appUrl) return
    setSignupUrl(`${appUrl.replace(/\/$/, '')}/signup`)
  }, [])

  const qrCodeUrl = signupUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(signupUrl)}`
    : ''

  return (
    <div className="mx-auto flex min-h-svh w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-primary sm:text-3xl">Scan to join the exercise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-5 p-6 text-center sm:p-8">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR code for signup"
              className="size-72 border border-border/70 bg-white p-3 sm:size-[32rem]"
            />
          ) : (
            <div
              role="status"
              className="flex size-72 items-center justify-center border border-border/70 bg-white p-3 text-sm text-muted-foreground sm:size-[32rem]"
            >
              Preparing signup QR code...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}