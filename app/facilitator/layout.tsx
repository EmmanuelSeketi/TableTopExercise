import { AdminSessionControls } from '@/components/admin-session-controls'

export default async function FacilitatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AdminSessionControls />
      {children}
    </>
  )
}
