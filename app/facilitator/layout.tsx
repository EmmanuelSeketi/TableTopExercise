import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, isAdminToken } from '@/lib/exercise-auth'
import { AdminSessionControls } from '@/components/admin-session-controls'

export default async function FacilitatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!isAdminToken(token)) redirect('/login?next=/facilitator')
  return (
    <>
      <AdminSessionControls />
      {children}
    </>
  )
}
