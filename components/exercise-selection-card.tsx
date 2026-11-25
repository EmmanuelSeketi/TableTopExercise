import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseManagementMenu } from '@/components/exercise-management-menu'
import { ExerciseOverviewVisual } from '@/components/inject-visual'

export function ExerciseSelectionCard({
  id,
  organization,
  audience,
  description,
  image,
  imageAlt,
}: {
  id: string
  organization: string
  audience: string
  description: string
  image: string
  imageAlt: string
}) {
  return (
    <div className="group relative h-full">
      <a
        href={`/projected?exercise=${encodeURIComponent(id)}`}
        className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-xl">
          <ExerciseOverviewVisual src={image} alt={imageAlt} compact />
          <CardHeader className="gap-1.5 p-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{organization}</p>
            <CardTitle className="text-lg">{audience}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <p className="min-h-10 pr-10 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <span className="inline-flex items-center gap-2 pr-12 text-sm font-semibold text-primary">
              Open exercise
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </CardContent>
        </Card>
      </a>
      <div className="absolute bottom-3 right-3 z-20">
        <ExerciseManagementMenu exerciseId={id} exerciseName={`${organization} ${audience}`} />
      </div>
    </div>
  )
}
