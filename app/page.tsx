import { ArrowRight } from 'lucide-react'
import { ExerciseOverviewVisual } from '@/components/inject-visual'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const exerciseInstances = [
  {
    id: 'meridian',
    organization: 'Meridian Financial Group',
    audience: 'Management & technical',
    description: 'Operation Ledger Lock',
    image: '/images/inject0.png',
    imageAlt: 'Illustrative Meridian exercise scenario',
  },
  {
    id: 'mimosa-technical',
    organization: 'Mimosa Mine',
    audience: 'Technical team',
    description: 'Underground communications disruption · 60 minutes',
    image: '/Overview Image.jpg',
    imageAlt: 'Aerial view of Mimosa Mine',
  },
  {
    id: 'mimosa-management',
    organization: 'Mimosa Mine',
    audience: 'Management team',
    description: 'Critical third-party service disruption · 60 minutes',
    image: '/Overview Image.jpg',
    imageAlt: 'Aerial view of Mimosa Mine',
  },
] as const

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Tabletop exercise</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Choose an organization</h1>
        <p className="text-muted-foreground">Select the exercise instance you want to open.</p>
      </header>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Exercise instances">
        {exerciseInstances.map((instance) => (
          <a
            key={instance.id}
            href={`/projected?exercise=${instance.id}`}
            className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-xl">
              <ExerciseOverviewVisual src={instance.image} alt={instance.imageAlt} />
              <CardHeader className="gap-1.5 pb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {instance.organization}
                </p>
                <CardTitle className="text-xl">{instance.audience}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">{instance.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open exercise
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </CardContent>
            </Card>
          </a>
        ))}
      </section>
    </main>
  )
}
