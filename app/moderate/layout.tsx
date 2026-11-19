import { AdminSessionControls } from '@/components/admin-session-controls'

export default function ModerateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AdminSessionControls />
      {children}
    </>
  )
}
