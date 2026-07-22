'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectedPage() {
  const signupUrl = 'http://localhost:3000/signup'
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
        <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
          <img
            src={qrCodeUrl}
            alt="QR code for signup"
            className="h-60 w-60 border border-border/70 bg-white p-3"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Scan to join</p>
            <Link
              href="/signup"
              className="text-sm font-semibold text-[#007A8E] underline-offset-4 hover:underline"
            >
              Open signup page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}