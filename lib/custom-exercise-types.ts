import type { Inject, Role } from './exercise-data'
import type { ExerciseDefinition, SessionFlowStep } from './exercise-instances'

export type CustomExerciseInjectDraft = Omit<Inject, 'imageUrl'> & {
  imageData?: string
}

export interface CustomExerciseDraft extends Omit<ExerciseDefinition, 'id' | 'organizationImageUrl'> {
  organizationImageData?: string
  scenario: Omit<ExerciseDefinition['scenario'], 'overviewImageUrl'> & {
    overviewImageData?: string
  }
  injects: CustomExerciseInjectDraft[]
}

export interface ExerciseCatalogItem {
  id: string
  organization: string
  organizationImageUrl?: string
  title: string
  audience: string
  durationMinutes: number
  overviewTitle: string
}

export interface ExerciseCatalogResponse {
  customExercises: ExerciseCatalogItem[]
  builtInOverrides: ExerciseDefinition[]
  deletedExerciseIds: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isRole(value: unknown): value is Role {
  return isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.summary) &&
    isStringArray(value.responsibilities) &&
    isString(value.decisionAuthority) &&
    isStringArray(value.expectedActions)
}

function isSessionFlowStep(value: unknown): value is SessionFlowStep {
  return isRecord(value) && isString(value.time) && isString(value.activity)
}

function isInject(value: unknown): value is CustomExerciseInjectDraft {
  if (!isRecord(value) || !isString(value.id) || typeof value.order !== 'number' ||
    !Number.isInteger(value.order) || !isString(value.time) ||
    !isString(value.title) || !isString(value.phase) || !isString(value.description) ||
    !isString(value.evidence) || !isString(value.facilitatorNotes) ||
    !isString(value.hint) || !isString(value.nist)) return false

  if (value.decisionPrompt !== undefined && !isString(value.decisionPrompt)) return false
  if (value.imageData !== undefined && !isString(value.imageData)) return false
  if (!Array.isArray(value.choices) || value.choices.length < 2 || value.choices.length > 12) return false
  if (!value.choices.every((choice) =>
    isRecord(choice) &&
    isString(choice.id) &&
    isString(choice.label) &&
    ['correct', 'wrong', 'neutral'].includes(String(choice.type)),
  )) return false
  if (value.choices.filter((choice) => isRecord(choice) && choice.type === 'correct').length !== 1) return false
  if (value.discussionPoints !== undefined && (
    !Array.isArray(value.discussionPoints) ||
    !value.discussionPoints.every((point) =>
      isRecord(point) && isString(point.role) && isString(point.prompt),
    )
  )) return false
  return true
}

export function validateCustomExerciseDraft(
  value: unknown,
  options: { allowMissingOrganizationImage?: boolean } = {},
): string | null {
  if (!isRecord(value)) return 'Exercise details are missing or invalid.'
  const durationMinutes = value.durationMinutes
  if (!isString(value.title) || !value.title.trim() || value.title.length > 160) return 'Add an exercise title (up to 160 characters).'
  if (!isString(value.organization) || !value.organization.trim() || value.organization.length > 120) return 'Add an organization name (up to 120 characters).'
  if (!isString(value.audience) || !value.audience.trim() || value.audience.length > 100) return 'Add an intended audience (up to 100 characters).'
  if (typeof durationMinutes !== 'number' || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 720) {
    return 'Duration must be between 1 and 720 minutes.'
  }
  if (!isRecord(value.scenario) ||
    !isString(value.scenario.title) || !value.scenario.title.trim() ||
    value.scenario.title.length > 180 ||
    !isString(value.scenario.initialSituation) || !value.scenario.initialSituation.trim() ||
    value.scenario.initialSituation.length > 20000 ||
    (value.scenario.overviewImageData !== undefined && !isString(value.scenario.overviewImageData))) {
    return 'Add an overview title and scenario description.'
  }
  if (value.organizationImageData === undefined) {
    if (!options.allowMissingOrganizationImage) return 'Upload an organization image.'
  } else if (!isString(value.organizationImageData) || !value.organizationImageData.startsWith('data:image/')) {
    return 'The organization image is invalid.'
  }
  if (!Array.isArray(value.roles) || value.roles.length === 0 || value.roles.length > 40 || !value.roles.every(isRole)) {
    return 'Add at least one valid role.'
  }
  if (value.roles.some((role) => !role.title.trim())) return 'Every role needs a title.'
  const roleTitles = new Set(value.roles.map((role) => role.title.trim().toLocaleLowerCase()))
  if (roleTitles.size !== value.roles.length) return 'Role names must be unique.'
  if (!Array.isArray(value.sessionFlow) || value.sessionFlow.length === 0 || value.sessionFlow.length > 40 || !value.sessionFlow.every(isSessionFlowStep)) {
    return 'Add at least one valid session-flow step.'
  }
  if (value.sessionFlow.some((step) => !step.time.trim() || !step.activity.trim())) return 'Every session-flow step needs a time and activity.'
  if (!Array.isArray(value.injects) || value.injects.length === 0 || value.injects.length > 40 || !value.injects.every(isInject)) {
    return 'Add at least one inject with at least two choices and exactly one correct choice.'
  }
  if (value.injects.some((inject) =>
    !inject.title.trim() ||
    !inject.phase.trim() ||
    !inject.description.trim() ||
    !/^\d+\s+min$/.test(inject.time) ||
    Number.parseInt(inject.time, 10) < 0 ||
    Number.parseInt(inject.time, 10) > durationMinutes ||
    inject.choices.some((choice) => !choice.label.trim()) ||
    (inject.discussionPoints ?? []).some((point) =>
      Boolean(point.role.trim() || point.prompt.trim()) &&
      (!point.role.trim() || !point.prompt.trim() || !roleTitles.has(point.role.trim().toLocaleLowerCase())),
    ),
  )) return 'Complete each inject, keep its time within the exercise, and finish any discussion prompts.'
  if (value.injects.some((inject) => inject.imageData !== undefined && !isString(inject.imageData))) {
    return 'An inject image is invalid.'
  }
  if (!Array.isArray(value.timeline) || !value.timeline.every((step) =>
    isRecord(step) &&
    isString(step.id) &&
    isString(step.time) &&
    typeof step.minute === 'number' &&
    isString(step.phase) &&
    isString(step.title) &&
    isString(step.detail)
  )) return 'The exercise timeline is invalid.'
  if (value.closingQuestions !== undefined && !isStringArray(value.closingQuestions)) return 'Debrief questions are invalid.'
  if (value.objectives !== undefined && !isStringArray(value.objectives)) return 'Exercise objectives are invalid.'
  if (value.exerciseBoundary !== undefined && !isString(value.exerciseBoundary)) return 'Exercise boundaries are invalid.'
  return null
}

export function parseCustomExerciseDraft(
  value: unknown,
  options: { allowMissingOrganizationImage?: boolean } = {},
): CustomExerciseDraft {
  const error = validateCustomExerciseDraft(value, options)
  if (error) throw new Error(error)
  return value as CustomExerciseDraft
}
