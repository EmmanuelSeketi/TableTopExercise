import type { ExerciseDefinition } from './exercise-instances'
import type { ActionItem, ExerciseState, Participant, ParticipantResponse } from './exercise-store'

export const REPORT_RATING_BANDS = {
  pass: 75,
  fair: 50,
  minimumRoleSample: 5,
} as const

export type ReportAnswerKind = 'correct' | 'wrong' | 'other'

export interface ReportResponse {
  participantId: string
  participantName: string
  roleName: string
  response: ParticipantResponse
  choiceLabel: string
  kind: ReportAnswerKind
}

export interface ReportCounts {
  responses: number
  correct: number
  wrong: number
  other: number
  correctRate: number | null
}

export interface InjectReport extends ReportCounts {
  id: string
  order: number
  title: string
  phase: string
  description: string
  evidence: string
  facilitatorNotes: string
  hint: string
  decisionPrompt?: string
  choices: {
    id: string
    label: string
    kind: ReportAnswerKind
    responses: ReportResponse[]
  }[]
  unrecognizedResponses: ReportResponse[]
  participatingCount: number
  participationRate: number | null
  roleCounts: Record<string, ReportCounts>
}

export interface RoleReport extends ReportCounts {
  name: string
  participants: number
  injectCounts: Record<string, ReportCounts>
}

export interface ParticipantReport extends ReportCounts {
  id: string
  name: string
  roleName: string
  injectCounts: Record<string, ReportCounts>
  participatedIn: number
}

export interface ExerciseReport {
  organization: string
  title: string
  reportDate: Date
  exerciseDate: Date | null
  actionItems: ActionItem[]
  registeredParticipants: number
  injectCount: number
  expectedResponseSlots: number
  totalResponses: number
  correct: number
  wrong: number
  other: number
  correctRate: number | null
  participationRate: number | null
  uniqueParticipantsResponded: number
  unmatchedInjectResponses: number
  unmatchedParticipantResponses: number
  injects: InjectReport[]
  roles: RoleReport[]
  participants: ParticipantReport[]
  mostSuccessfulInjects: InjectReport[]
  mostFailedInjects: InjectReport[]
  passedInjects: InjectReport[]
  fairInjects: InjectReport[]
  failedInjects: InjectReport[]
  mostWrongRoles: RoleReport[]
  lowestRatedRoles: RoleReport[]
  highestRatedRoles: RoleReport[]
  mostWrongParticipants: ParticipantReport[]
  highestRatedParticipants: ParticipantReport[]
  roleRatingSampleIsSmall: boolean
}

function emptyCounts(): ReportCounts {
  return { responses: 0, correct: 0, wrong: 0, other: 0, correctRate: null }
}

function finishCounts(counts: ReportCounts): ReportCounts {
  return {
    ...counts,
    correctRate: counts.responses > 0 ? (counts.correct / counts.responses) * 100 : null,
  }
}

function answerKind(type: string | undefined): ReportAnswerKind {
  if (type === 'correct') return 'correct'
  if (type === 'wrong') return 'wrong'
  return 'other'
}

function participantRole(participant: Participant, definition: ExerciseDefinition) {
  if (participant.roleId === 'custom') return participant.customRole?.trim() || 'Custom role'
  return definition.roles.find((role) => role.id === participant.roleId)?.title ?? 'Unassigned'
}

function responseCompare(left: ReportResponse, right: ReportResponse) {
  return left.response.submittedAt - right.response.submittedAt
}

function getRating(correctRate: number | null) {
  if (correctRate === null) return 'Not rated'
  if (correctRate >= REPORT_RATING_BANDS.pass) return 'Pass'
  if (correctRate >= REPORT_RATING_BANDS.fair) return 'Fair'
  return 'Fail'
}

function buildResponseEntry(
  response: ParticipantResponse,
  participant: Participant | undefined,
  definition: ExerciseDefinition,
): ReportResponse {
  const inject = definition.injects.find((item) => item.id === response.injectId)
  const choice = inject?.choices.find((item) => item.id === response.choice)
  return {
    participantId: participant?.deviceId ?? response.participantId,
    participantName: participant?.name ?? 'Unmatched participant',
    roleName: participant ? participantRole(participant, definition) : 'Unassigned',
    response,
    choiceLabel: choice?.label ?? 'Unrecognized answer',
    kind: answerKind(choice?.type),
  }
}

function sortedTies<T>(values: T[], metric: (value: T) => number) {
  if (values.length === 0) return []
  const best = Math.max(...values.map(metric))
  return values.filter((value) => metric(value) === best)
}

function sortedLowestTies<T>(values: T[], metric: (value: T) => number) {
  if (values.length === 0) return []
  const lowest = Math.min(...values.map(metric))
  return values.filter((value) => metric(value) === lowest)
}

export function buildExerciseReport(
  definition: ExerciseDefinition,
  state: Pick<ExerciseState, 'participants' | 'responses' | 'settings' | 'aarNotes' | 'actionItems'>,
  reportDate = new Date(),
): ExerciseReport {
  const participantByIdentifier = new Map<string, Participant>()
  for (const participant of state.participants) {
    participantByIdentifier.set(participant.deviceId, participant)
    participantByIdentifier.set(participant.id, participant)
  }
  const injectById = new Map(definition.injects.map((inject) => [inject.id, inject]))
  const matchedResponses = state.responses.filter((response) => injectById.has(response.injectId))
  const unmatchedInjectResponses = state.responses.length - matchedResponses.length
  const responseEntries = matchedResponses.map((response) =>
    buildResponseEntry(response, participantByIdentifier.get(response.participantId), definition),
  )
  const unmatchedParticipantResponses = responseEntries.filter(
    (entry) => !participantByIdentifier.has(entry.participantId),
  ).length

  const injects: InjectReport[] = definition.injects.map((inject) => {
    const entries = responseEntries
      .filter((entry) => entry.response.injectId === inject.id)
      .sort(responseCompare)
    const registeredEntries = entries.filter((entry) => participantByIdentifier.has(entry.participantId))
    const counts = entries.reduce<ReportCounts>((result, entry) => {
      result.responses += 1
      result[entry.kind] += 1
      return result
    }, emptyCounts())
    const roleCounts: Record<string, ReportCounts> = {}

    for (const entry of entries) {
      const current = roleCounts[entry.roleName] ?? emptyCounts()
      current.responses += 1
      current[entry.kind] += 1
      roleCounts[entry.roleName] = current
    }

    return {
      ...finishCounts(counts),
      id: inject.id,
      order: inject.order,
      title: inject.title,
      phase: inject.phase,
      description: inject.description,
      evidence: inject.evidence,
      facilitatorNotes: inject.facilitatorNotes,
      hint: inject.hint,
      decisionPrompt: inject.decisionPrompt,
      choices: inject.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        kind: answerKind(choice.type),
        responses: entries.filter((entry) => entry.response.choice === choice.id),
      })),
      unrecognizedResponses: entries.filter(
        (entry) => !inject.choices.some((choice) => choice.id === entry.response.choice),
      ),
      participatingCount: new Set(registeredEntries.map((entry) => entry.participantId)).size,
      participationRate: state.participants.length > 0
        ? (new Set(registeredEntries.map((entry) => entry.participantId)).size / state.participants.length) * 100
        : null,
      roleCounts: Object.fromEntries(
        Object.entries(roleCounts).map(([name, value]) => [name, finishCounts(value)]),
      ),
    }
  })

  const participantReports: ParticipantReport[] = state.participants.map((participant) => {
    const participantEntries = responseEntries.filter(
      (entry) => entry.participantId === participant.deviceId,
    )
    const counts = participantEntries.reduce<ReportCounts>((result, entry) => {
      result.responses += 1
      result[entry.kind] += 1
      return result
    }, emptyCounts())
    const injectCounts: Record<string, ReportCounts> = {}
    for (const inject of definition.injects) {
      const injectEntries = participantEntries.filter((entry) => entry.response.injectId === inject.id)
      const injectResult = injectEntries.reduce<ReportCounts>((result, entry) => {
        result.responses += 1
        result[entry.kind] += 1
        return result
      }, emptyCounts())
      injectCounts[inject.id] = finishCounts(injectResult)
    }
    return {
      ...finishCounts(counts),
      id: participant.deviceId,
      name: participant.name,
      roleName: participantRole(participant, definition),
      injectCounts,
      participatedIn: new Set(participantEntries.map((entry) => entry.response.injectId)).size,
    }
  })

  const roleMembers = new Map<string, Set<string>>()
  for (const participant of state.participants) {
    const roleName = participantRole(participant, definition)
    const members = roleMembers.get(roleName) ?? new Set<string>()
    members.add(participant.deviceId)
    roleMembers.set(roleName, members)
  }
  const roleNames = new Set(responseEntries.map((entry) => entry.roleName))
  const roles: RoleReport[] = Array.from(roleNames).map((name) => {
    const entries = responseEntries.filter((entry) => entry.roleName === name)
    const counts = entries.reduce<ReportCounts>((result, entry) => {
      result.responses += 1
      result[entry.kind] += 1
      return result
    }, emptyCounts())
    const injectCounts: Record<string, ReportCounts> = {}
    for (const inject of definition.injects) {
      const injectEntries = entries.filter((entry) => entry.response.injectId === inject.id)
      const injectResult = injectEntries.reduce<ReportCounts>((result, entry) => {
        result.responses += 1
        result[entry.kind] += 1
        return result
      }, emptyCounts())
      injectCounts[inject.id] = finishCounts(injectResult)
    }
    return {
      ...finishCounts(counts),
      name,
      participants: roleMembers.get(name)?.size ?? new Set(entries.map((entry) => entry.participantId)).size,
      injectCounts,
    }
  }).sort((left, right) => right.responses - left.responses || left.name.localeCompare(right.name))

  const totals = responseEntries.reduce<ReportCounts>((result, entry) => {
    result.responses += 1
    result[entry.kind] += 1
    return result
  }, emptyCounts())
  const totalResponseSlots = new Set(
    responseEntries
      .filter((entry) => participantByIdentifier.has(entry.participantId))
      .map((entry) => `${entry.participantId}\u0000${entry.response.injectId}`),
  ).size
  const expectedResponseSlots = state.participants.length * definition.injects.length
  const uniqueParticipantsResponded = new Set(
    responseEntries
      .filter((entry) => participantByIdentifier.has(entry.participantId))
      .map((entry) => entry.participantId),
  ).size
  const ratedInjects = injects.filter((inject) => inject.correctRate !== null)
  const rankedRoles = roles.filter((role) => role.responses >= REPORT_RATING_BANDS.minimumRoleSample)
  const roleRanking = rankedRoles.length > 0 ? rankedRoles : roles
  const exerciseDateValue = responseEntries.length > 0
    ? Math.min(...responseEntries.map((entry) => entry.response.submittedAt))
    : null
  const wrongParticipants = participantReports.filter((participant) => participant.wrong > 0)
  const successfulParticipants = participantReports.filter((participant) => participant.responses >= 2)

  return {
    organization: definition.organization,
    title: state.settings.title || definition.title,
    reportDate,
    exerciseDate: exerciseDateValue === null ? null : new Date(exerciseDateValue),
    actionItems: state.actionItems,
    registeredParticipants: state.participants.length,
    injectCount: definition.injects.length,
    expectedResponseSlots,
    totalResponses: totals.responses,
    correct: totals.correct,
    wrong: totals.wrong,
    other: totals.other,
    correctRate: finishCounts(totals).correctRate,
    participationRate: expectedResponseSlots > 0
      ? (totalResponseSlots / expectedResponseSlots) * 100
      : null,
    uniqueParticipantsResponded,
    unmatchedInjectResponses,
    unmatchedParticipantResponses,
    injects,
    roles,
    participants: participantReports.sort((left, right) => left.name.localeCompare(right.name)),
    mostSuccessfulInjects: ratedInjects.length > 0
      ? sortedTies(ratedInjects, (inject) => inject.correctRate ?? 0)
      : [],
    mostFailedInjects: ratedInjects.some((inject) => inject.wrong > 0)
      ? sortedTies(ratedInjects, (inject) => inject.wrong)
      : [],
    passedInjects: ratedInjects.filter((inject) => getRating(inject.correctRate) === 'Pass'),
    fairInjects: ratedInjects.filter((inject) => getRating(inject.correctRate) === 'Fair'),
    failedInjects: ratedInjects.filter((inject) => getRating(inject.correctRate) === 'Fail'),
    mostWrongRoles: roles.some((role) => role.wrong > 0)
      ? sortedTies(roles, (role) => role.wrong)
      : [],
    lowestRatedRoles: roleRanking.length > 0
      ? sortedLowestTies(roleRanking, (role) => role.correctRate ?? 0)
      : [],
    highestRatedRoles: roles.length > 0
      ? sortedTies(roles, (role) => role.correctRate ?? 0)
      : [],
    mostWrongParticipants: wrongParticipants.length > 0
      ? sortedTies(wrongParticipants, (participant) => participant.wrong)
      : [],
    highestRatedParticipants: successfulParticipants.length > 0
      ? sortedTies(successfulParticipants, (participant) => participant.correctRate ?? 0)
      : [],
    roleRatingSampleIsSmall: rankedRoles.length === 0 && roles.length > 0,
  }
}

export function getReportRating(correctRate: number | null) {
  return getRating(correctRate)
}
