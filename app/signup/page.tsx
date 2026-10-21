'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ParticipantsSection } from '@/components/sections/participants'

export default function SignupPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <figure className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-sm">
          <Image
            src="/images/signup cover.jpg"
            alt="Meridian Financial Group office lobby"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1152px"
            className="object-cover"
          />
        </figure>
        <ParticipantsSection onContinue={() => router.push('/participant')} />
      </div>
    </div>
  )
}