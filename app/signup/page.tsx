'use client'

import { ParticipantsSection } from '@/components/sections/participants'

export default function SignupPage() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-center rounded-lg bg-[#03262c] p-4 sm:p-6">
        <img
          src="/celium-logo.png"
          alt="Celium — The Data Protection Symposium 2024"
          className="h-auto w-full max-w-xl"
        />
      </div>

      <ParticipantsSection />
    </div>
  )
}