import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseOverviewVisual } from '@/components/inject-visual'

export default function MimosaSelectionPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-8 px-4 py-10">
      <div className="space-y-3">
        <a href="/" className="-ml-3 inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-foreground hover:bg-muted">
          <ArrowLeft className="size-4" /> Organizations
        </a>
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mimosa Mine</p>
          <h1 className="text-3xl font-semibold tracking-tight">Choose a team exercise</h1>
          <p className="text-muted-foreground">Each team has its own exercise progress and participant responses.</p>
        </header>
      </div>
      <div className="space-y-5">
        <ExerciseOverviewVisual src="/Overview Image.jpg" alt="Aerial view of Mimosa Mine" />
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/projected?exercise=mimosa-technical" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Card className="h-full transition-colors hover:border-primary/60 hover:bg-muted/30">
              <CardHeader><CardTitle>Technical team</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Underground communications disruption · 60 minutes</p></CardContent>
            </Card>
          </a>
          <a href="/projected?exercise=mimosa-management" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Card className="h-full transition-colors hover:border-primary/60 hover:bg-muted/30">
              <CardHeader><CardTitle>Management team</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Critical third-party service disruption: Microsoft Dynamics 365 · 60 minutes</p></CardContent>
            </Card>
          </a>
        </div>
      </div>
    </main>
  )
}
