'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectedPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const signupUrl = `${appUrl.replace(/\/$/, '')}/signup`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(signupUrl)}`

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
        <CardHeader>
          <CardTitle className="text-[#0a5763]">Join the exercise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <img
            src={qrCodeUrl}
            alt="QR code for signup"
            className="h-60 w-60 border border-border/70 bg-white p-3"
          />
          <p className="text-sm font-medium text-foreground">Scan to Join</p>
        </CardContent>
      </Card>
    </div>
  )
}