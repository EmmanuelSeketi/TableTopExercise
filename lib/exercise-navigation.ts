import type { Inject } from './exercise-data'
import type { ExerciseDefinition } from './exercise-instances'

export const EXERCISE_STEP_IDS = {
  sessionFlow: '__exercise_session_flow__',
  overview: '__exercise_overview__',
  closing: '__exercise_closing__',
} as const

export type ExerciseStep =
  | { id: string; kind: 'session-flow' | 'overview' | 'closing'; title: string }
  | { id: string; kind: 'inject'; title: string; inject: Inject }

export function getExerciseSteps(definition: ExerciseDefinition): ExerciseStep[] {
  const steps: ExerciseStep[] = []
  const hasSessionFlow = Boolean(definition.sessionFlow?.length)
  const hasClosing = Boolean(definition.closingQuestions?.length)

  if (hasSessionFlow) {
    steps.push({
      id: EXERCISE_STEP_IDS.sessionFlow,
      kind: 'session-flow',
      title: 'Session flow',
    })
  }

  if (hasSessionFlow || hasClosing) {
    steps.push({
      id: EXERCISE_STEP_IDS.overview,
      kind: 'overview',
      title: 'Exercise overview',
    })
  }

  for (const inject of definition.injects) {
    steps.push({
      id: inject.id,
      kind: 'inject',
      title: inject.title,
      inject,
    })
  }

  if (hasClosing) {
    steps.push({
      id: EXERCISE_STEP_IDS.closing,
      kind: 'closing',
      title: 'Closing debrief',
    })
  }

  return steps
}

export function getCurrentExerciseStep(definition: ExerciseDefinition, activeStepId: string | null) {
  const steps = getExerciseSteps(definition)
  if (activeStepId === null && steps[0]?.kind === 'inject') {
    return {
      steps,
      index: -1,
      step: {
        id: EXERCISE_STEP_IDS.overview,
        kind: 'overview' as const,
        title: 'Exercise overview',
      },
    }
  }

  const activeIndex = activeStepId === null ? 0 : steps.findIndex((step) => step.id === activeStepId)
  const index = activeIndex < 0 ? 0 : activeIndex

  return { steps, index, step: steps[index] }
}
