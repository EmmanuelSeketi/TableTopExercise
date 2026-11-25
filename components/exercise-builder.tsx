'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Role, TimelineEvent } from '@/lib/exercise-data'
import type { CustomExerciseDraft } from '@/lib/custom-exercise-types'
import type { ExerciseDefinition, SessionFlowStep } from '@/lib/exercise-instances'

interface BuilderRole {
  id?: string
  title: string
  summary: string
  responsibilities: string[]
  decisionAuthority: string
  expectedActions: string[]
}

interface BuilderChoice {
  id?: string
  label: string
  type: 'correct' | 'wrong' | 'neutral'
}

interface BuilderDiscussionPoint {
  role: string
  prompt: string
}

interface BuilderInject {
  id?: string
  timelineId?: string
  minute: number
  title: string
  phase: string
  description: string
  decisionPrompt: string
  evidence: string
  nist: string
  facilitatorNotes: string
  hint: string
  choices: BuilderChoice[]
  discussionPoints: BuilderDiscussionPoint[]
  imageData?: string
  imageUrl?: string
}

interface BuilderDraft {
  organization: string
  organizationImageData?: string
  organizationImageUrl?: string
  title: string
  audience: string
  durationMinutes: number
  roles: BuilderRole[]
  sessionFlow: SessionFlowStep[]
  scenarioTitle: string
  initialSituation: string
  objectives: string[]
  overviewImageData?: string
  overviewImageUrl?: string
  exerciseBoundary: string
  closingQuestions: string[]
  preservedTimeline: TimelineEvent[]
  injects: BuilderInject[]
}

const STEPS = ['Organization', 'Roles', 'Session flow', 'Overview', 'Injects']

const EMPTY_ROLE: BuilderRole = {
  id: undefined,
  title: '',
  summary: '',
  responsibilities: [],
  decisionAuthority: '',
  expectedActions: [],
}

const EMPTY_INJECT: BuilderInject = {
  minute: 10,
  title: '',
  phase: '',
  description: '',
  decisionPrompt: '',
  evidence: '',
  nist: '',
  facilitatorNotes: '',
  hint: '',
  choices: [
    { label: '', type: 'correct' },
    { label: '', type: 'wrong' },
  ],
  discussionPoints: [],
}

const INITIAL_DRAFT: BuilderDraft = {
  organization: '',
  title: '',
  audience: 'Management and technical',
  durationMinutes: 60,
  roles: [{ ...EMPTY_ROLE }],
  sessionFlow: [{ time: '0–10 minutes', activity: '' }],
  scenarioTitle: '',
  initialSituation: '',
  objectives: [],
  exerciseBoundary: '',
  closingQuestions: [],
  preservedTimeline: [],
  injects: [{ ...EMPTY_INJECT }],
}

function createInitialDraft(definition?: ExerciseDefinition): BuilderDraft {
  if (!definition) return INITIAL_DRAFT
  return {
    organization: definition.organization,
    organizationImageUrl: definition.organizationImageUrl,
    title: definition.title,
    audience: definition.audience,
    durationMinutes: definition.durationMinutes,
    roles: definition.roles.map((role) => ({
      id: role.id,
      title: role.title,
      summary: role.summary,
      responsibilities: role.responsibilities,
      decisionAuthority: role.decisionAuthority,
      expectedActions: role.expectedActions,
    })),
    sessionFlow: definition.sessionFlow?.length
      ? definition.sessionFlow.map((step) => ({ ...step }))
      : [{ time: `0–${definition.durationMinutes} minutes`, activity: 'Briefing, inject discussions, and debrief' }],
    scenarioTitle: definition.scenario.title,
    initialSituation: definition.scenario.initialSituation,
    objectives: definition.objectives ?? [],
    overviewImageUrl: definition.scenario.overviewImageUrl,
    exerciseBoundary: definition.exerciseBoundary ?? '',
    closingQuestions: definition.closingQuestions ?? [],
    preservedTimeline: definition.timeline,
    injects: definition.injects.map((inject) => {
      const event = definition.timeline.find((timelineEvent) => timelineEvent.injectId === inject.id)
      return {
        id: inject.id,
        timelineId: event?.id,
        minute: event?.minute ?? (Number.parseInt(inject.time, 10) || 0),
        title: inject.title,
        phase: inject.phase,
        description: inject.description,
        decisionPrompt: inject.decisionPrompt ?? '',
        evidence: inject.evidence,
        nist: inject.nist,
        facilitatorNotes: inject.facilitatorNotes,
        hint: inject.hint,
        choices: inject.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          type: choice.type === 'correct' || choice.type === 'neutral' ? choice.type : 'wrong',
        })),
        discussionPoints: inject.discussionPoints?.map((point) => ({ ...point })) ?? [],
        imageUrl: inject.imageUrl,
      }
    }),
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  min,
  max,
  rows,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: 'text' | 'number'
  min?: number
  max?: number
  rows?: number
}) {
  const className = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'
  return (
    <label className="block space-y-1.5 text-sm font-medium text-foreground">
      <span>{label}{required && <span className="text-destructive"> *</span>}</span>
      {rows ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className={className}
        />
      )}
    </label>
  )
}

function ImageField({
  label,
  value,
  onChange,
  required = false,
  onError,
}: {
  label: string
  value?: string
  onChange: (value?: string) => void
  required?: boolean
  onError: (message: string | null) => void
}) {
  function readFile(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      onError('Each image must be smaller than 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        onError('The selected image could not be read.')
        return
      }
      onChange(reader.result)
      onError(null)
    }
    reader.onerror = () => onError('The selected image could not be read.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          <Upload className="size-4" />
          {value ? 'Change image' : 'Upload image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={required && !value}
            className="sr-only"
            onChange={(event) => readFile(event.target.files?.[0])}
          />
        </label>
        <span className="text-xs text-muted-foreground">JPEG, PNG or WebP · up to 2 MB</span>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-destructive underline">
            Remove image
          </button>
        )}
      </div>
      {value && (
        <img src={value} alt={`${label} preview`} className="max-h-48 w-auto max-w-full rounded-lg border border-border object-contain" />
      )}
    </div>
  )
}

function splitLines(value: string[]) {
  return value.join('\n')
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export function ExerciseBuilder({ initialDefinition }: { initialDefinition?: ExerciseDefinition } = {}) {
  const isEditing = Boolean(initialDefinition)
  const [draft, setDraft] = useState<BuilderDraft>(() => createInitialDraft(initialDefinition))
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validateStep(index: number) {
    if (index === 0) {
      if (!draft.organization.trim()) return 'Enter the organization name.'
      if (!isEditing && !draft.organizationImageData) {
        return 'Upload an organization image to display on the selection page.'
      }
      if (!draft.title.trim()) return 'Enter an exercise title.'
      if (!draft.audience.trim()) return 'Enter who the exercise is for.'
      if (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes < 1 || draft.durationMinutes > 720) {
        return 'Set a duration between 1 and 720 minutes.'
      }
    }
    if (index === 1) {
      if (draft.roles.length === 0 || draft.roles.some((role) => !role.title.trim())) {
        return 'Add at least one role and give every role a title.'
      }
      const roleNames = draft.roles.map((role) => role.title.trim().toLocaleLowerCase())
      if (new Set(roleNames).size !== roleNames.length) return 'Role names must be unique.'
    }
    if (index === 2) {
      if (draft.sessionFlow.length === 0 || draft.sessionFlow.some((item) => !item.time.trim() || !item.activity.trim())) {
        return 'Add at least one session-flow step with a time and activity.'
      }
    }
    if (index === 3 && (!draft.scenarioTitle.trim() || !draft.initialSituation.trim())) {
      return 'Add an overview title and describe the scenario.'
    }
    if (index === 4) {
      if (draft.injects.length === 0) return 'Add at least one inject.'
      for (let injectIndex = 0; injectIndex < draft.injects.length; injectIndex += 1) {
        const inject = draft.injects[injectIndex]
        if (!inject.title.trim() || !inject.phase.trim() || !inject.description.trim()) {
          return `Complete the title, stage and situation for Inject ${injectIndex + 1}.`
        }
        if (!Number.isInteger(inject.minute) || inject.minute < 0 || inject.minute > draft.durationMinutes) {
          return `Set the time for Inject ${injectIndex + 1} between 0 and the exercise duration.`
        }
        if (inject.choices.length < 2 || inject.choices.some((choice) => !choice.label.trim())) {
          return `Add at least two complete choices to Inject ${injectIndex + 1}.`
        }
        if (inject.choices.filter((choice) => choice.type === 'correct').length !== 1) {
          return `Mark exactly one choice as correct in Inject ${injectIndex + 1}.`
        }
        const roleNames = new Set(draft.roles.map((role) => role.title.trim().toLocaleLowerCase()))
        if (inject.discussionPoints.some((point) =>
          Boolean(point.role.trim() || point.prompt.trim()) &&
          (!point.role.trim() || !point.prompt.trim() || !roleNames.has(point.role.trim().toLocaleLowerCase())),
        )) {
          return `Complete the role and discussion prompt in Inject ${injectIndex + 1}.`
        }
      }
    }
    return null
  }

  function nextStep() {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function buildPayload(): CustomExerciseDraft {
    const injects = draft.injects.map((inject, index) => {
      const { minute, timelineId: _timelineId, imageUrl: _imageUrl, ...fields } = inject
      return {
        ...fields,
        id: inject.id ?? `inject-${index + 1}`,
        order: index + 1,
        time: `${minute} min`,
        choices: inject.choices.map((choice, choiceIndex) => ({
          id: choice.id ?? `choice-${choiceIndex + 1}`,
          label: choice.label.trim(),
          type: choice.type,
        })),
        discussionPoints: inject.discussionPoints
          .filter((point) => point.role.trim() && point.prompt.trim())
          .map((point) => ({ role: point.role.trim(), prompt: point.prompt.trim() })),
      }
    })
    const injectTimeline: TimelineEvent[] = injects.map((inject, index) => {
      const minute = draft.injects[index].minute
      return {
        id: draft.injects[index].timelineId ?? `timeline-${index + 1}`,
        time: `${String(minute).padStart(2, '0')}:00`,
        minute,
        phase: inject.phase,
        title: inject.title,
        detail: inject.description,
        injectId: inject.id,
      }
    })
    const timeline = [
      ...draft.preservedTimeline.filter((event) => !event.injectId),
      ...injectTimeline,
    ].sort((first, second) => first.minute - second.minute)

    const roles: Role[] = draft.roles.map((role, index) => ({
      id: role.id ?? `role-${index + 1}`,
      title: role.title.trim(),
      summary: role.summary,
      responsibilities: role.responsibilities,
      decisionAuthority: role.decisionAuthority,
      expectedActions: role.expectedActions,
    }))

    return {
      title: draft.title.trim(),
      organization: draft.organization.trim(),
      organizationImageData: draft.organizationImageData,
      durationMinutes: draft.durationMinutes,
      audience: draft.audience.trim(),
      scenario: {
        title: draft.scenarioTitle.trim(),
        initialSituation: draft.initialSituation.trim(),
        ...(draft.overviewImageData ? { overviewImageData: draft.overviewImageData } : {}),
      },
      injects,
      roles,
      timeline,
      objectives: draft.objectives,
      exerciseBoundary: draft.exerciseBoundary,
      closingQuestions: draft.closingQuestions,
      sessionFlow: draft.sessionFlow.map((item) => ({
        time: item.time.trim(),
        activity: item.activity.trim(),
      })),
    }
  }

  async function saveExercise() {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const endpoint = initialDefinition
        ? `/api/exercises/${encodeURIComponent(initialDefinition.id)}`
        : '/api/exercises'
      const response = await fetch(
        endpoint,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        },
      )
      const result = (await response.json().catch(() => null)) as
        | { exercise?: { id: string }; error?: string }
        | null
      if (!response.ok || !result?.exercise?.id) {
        throw new Error(result?.error ?? `Exercise could not be saved (${response.status})`)
      }
      window.location.assign(`/facilitator?exercise=${encodeURIComponent(result.exercise.id)}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Exercise could not be saved.')
      setSaving(false)
    }
  }

  function updateInject(index: number, patch: Partial<BuilderInject>) {
    setDraft((current) => ({ ...current, injects: updateAt(current.injects, index, patch) }))
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <a href="/" className="order-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:order-1 sm:justify-self-start">
          <ArrowLeft className="size-4" /> Back to organizations
        </a>
        <h1 className="order-1 text-center text-2xl font-semibold tracking-tight text-foreground sm:order-2 sm:text-3xl">
          {isEditing ? 'Edit exercise' : 'Create an exercise'}
        </h1>
        <span aria-hidden="true" className="hidden sm:block sm:order-3" />
      </header>

      <nav aria-label="Exercise creation steps" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((title, index) => (
          <button
            key={title}
            type="button"
            disabled={index > step}
            onClick={() => {
              if (index < step) {
                setError(null)
                setStep(index)
              }
            }}
            aria-current={index === step ? 'step' : undefined}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold sm:text-sm ${
              index === step
                ? 'border-primary bg-primary/10 text-primary'
                : index < step
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-border bg-muted/30 text-muted-foreground'
            }`}
          >
            <span className="mr-1.5">{index + 1}.</span>{title}
          </button>
        ))}
      </nav>

      <section className="space-y-6 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
        {step === 0 && (
          <>
            <StepHeading title="Organization and exercise" description="Set the organization identity, exercise title, audience, duration and selection-page image." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" value={draft.organization} required placeholder="e.g. Northstar Utilities" onChange={(organization) => setDraft((current) => ({ ...current, organization }))} />
              <Field label="Exercise title" value={draft.title} required placeholder="e.g. Service disruption response" onChange={(title) => setDraft((current) => ({ ...current, title }))} />
              <Field label="Audience" value={draft.audience} required placeholder="e.g. Management and technical teams" onChange={(audience) => setDraft((current) => ({ ...current, audience }))} />
              <Field label="Duration (minutes)" type="number" min={1} max={720} value={draft.durationMinutes} required onChange={(value) => setDraft((current) => ({ ...current, durationMinutes: Number(value) }))} />
            </div>
            <ImageField
              label={isEditing ? 'Replace organization image (optional)' : 'Organization image'}
              value={draft.organizationImageData}
              required={!isEditing}
              onChange={(organizationImageData) => setDraft((current) => ({ ...current, organizationImageData }))}
              onError={setError}
            />
            {isEditing && draft.organizationImageUrl && !draft.organizationImageData && (
              <img src={draft.organizationImageUrl} alt="Current organization image" className="max-h-48 w-auto max-w-full rounded-lg border border-border object-contain" />
            )}
          </>
        )}

        {step === 1 && (
          <>
            <StepHeading title="Roles" description="Add the participant roles for this exercise." />
            <div className="space-y-4">
              {draft.roles.map((role, index) => (
                <article key={index} className="space-y-4 rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Role {index + 1}</h3>
                    {draft.roles.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((current) => ({ ...current, roles: current.roles.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="size-4" /> Remove</Button>}
                  </div>
                  <Field
                    label="Role name"
                    value={role.title}
                    required
                    placeholder="e.g. Incident lead"
                    onChange={(title) => setDraft((current) => {
                      const previousTitle = current.roles[index].title.trim().toLocaleLowerCase()
                      return {
                        ...current,
                        roles: updateAt(current.roles, index, { title }),
                        injects: current.injects.map((inject) => ({
                          ...inject,
                          discussionPoints: inject.discussionPoints.map((point) =>
                            previousTitle && point.role.trim().toLocaleLowerCase() === previousTitle
                              ? { ...point, role: title }
                              : point,
                          ),
                        })),
                      }
                    })}
                  />
                </article>
              ))}
              <Button type="button" variant="outline" onClick={() => setDraft((current) => ({ ...current, roles: [...current.roles, { ...EMPTY_ROLE }] }))}><Plus className="size-4" /> Add role</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading title="Session flow" description="Map the time blocks and activities participants will move through." />
            <div className="space-y-3">
              {draft.sessionFlow.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-[0.7fr_1.7fr_auto] sm:items-end">
                  <Field label={`Step ${index + 1} time`} value={item.time} required placeholder="0–10 minutes" onChange={(time) => setDraft((current) => ({ ...current, sessionFlow: updateAt(current.sessionFlow, index, { time }) }))} />
                  <Field label="Activity" value={item.activity} required placeholder="Briefing, inject discussion, debrief..." onChange={(activity) => setDraft((current) => ({ ...current, sessionFlow: updateAt(current.sessionFlow, index, { activity }) }))} />
                  {draft.sessionFlow.length > 1 && <Button type="button" variant="ghost" size="sm" aria-label={`Remove step ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, sessionFlow: current.sessionFlow.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="size-4" /></Button>}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setDraft((current) => ({ ...current, sessionFlow: [...current.sessionFlow, { time: '', activity: '' }] }))}><Plus className="size-4" /> Add session step</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeading title="Exercise overview" description="Write the briefing participants read before the injects. The overview image is optional." />
            <Field label="Overview title" value={draft.scenarioTitle} required placeholder="e.g. A disruption during peak operations" onChange={(scenarioTitle) => setDraft((current) => ({ ...current, scenarioTitle }))} />
            <Field label="Scenario overview" value={draft.initialSituation} required rows={8} placeholder="Set the scene, explain what is happening, what is known, and what is uncertain." onChange={(initialSituation) => setDraft((current) => ({ ...current, initialSituation }))} />
            <ImageField
              label={isEditing ? 'Replace overview image (optional)' : 'Overview image (optional)'}
              value={draft.overviewImageData}
              onChange={(overviewImageData) => setDraft((current) => ({ ...current, overviewImageData }))}
              onError={setError}
            />
            {isEditing && draft.overviewImageUrl && !draft.overviewImageData && (
              <img src={draft.overviewImageUrl} alt="Current overview image" className="max-h-48 w-auto max-w-full rounded-lg border border-border object-contain" />
            )}
          </>
        )}

        {step === 4 && (
          <>
            <StepHeading title="Injects and decisions" description="Each inject needs a situation and at least two choices, with exactly one marked correct. Wrong and neutral choices are optional classifications." />
            <div className="space-y-5">
              {draft.injects.map((inject, index) => (
                <article key={index} className="space-y-4 rounded-xl border border-border/70 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">Inject {index + 1}</h3>
                    {draft.injects.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft((current) => ({ ...current, injects: current.injects.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="size-4" /> Remove</Button>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Time (minutes from start)" type="number" min={0} max={draft.durationMinutes} value={inject.minute} required onChange={(value) => updateInject(index, { minute: Number(value) })} />
                    <div className="space-y-1.5">
                      <Field label="Scenario stage / phase" value={inject.phase} required placeholder="e.g. Detection, containment, recovery" onChange={(phase) => updateInject(index, { phase })} />
                      <p className="text-xs font-normal text-muted-foreground">Where this inject falls in the scenario timeline.</p>
                    </div>
                  </div>
                  <Field label="Inject title" value={inject.title} required placeholder="Short, clear title" onChange={(title) => updateInject(index, { title })} />
                  <Field label="What participants are told" value={inject.description} required rows={4} placeholder="Describe the new information or event for this inject." onChange={(description) => updateInject(index, { description })} />
                  <Field label="Decision prompt (optional)" value={inject.decisionPrompt} rows={2} placeholder="What decision should participants make?" onChange={(decisionPrompt) => updateInject(index, { decisionPrompt })} />
                  <div className="space-y-1.5">
                    <Field label="Framework / category (optional)" value={inject.nist} placeholder="e.g. NIST SP 800-61 or MITRE ATT&CK" onChange={(nist) => updateInject(index, { nist })} />
                    <p className="text-xs font-normal text-muted-foreground">An optional standard or subject classification; it may differ from the scenario stage above.</p>
                  </div>
                  <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">Answer choices</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => updateInject(index, { choices: [...inject.choices, { label: '', type: 'wrong' }] })} disabled={inject.choices.length >= 12}><Plus className="size-4" /> Add choice</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Choose exactly one Correct answer. Mark other choices Wrong or Neutral as appropriate.</p>
                    {inject.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="grid gap-2 rounded-lg border border-border/70 bg-background p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
                        <Field label={`Choice ${String.fromCharCode(65 + choiceIndex)}`} value={choice.label} required placeholder="Write the participant response option" onChange={(label) => updateInject(index, { choices: updateAt(inject.choices, choiceIndex, { label }) })} />
                        <label className="block space-y-1.5 text-sm font-medium">
                          <span>Classification</span>
                          <select
                            value={choice.type}
                            onChange={(event) => updateInject(index, { choices: updateAt(inject.choices, choiceIndex, { type: event.target.value as BuilderChoice['type'] }) })}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                          >
                            <option value="correct">Correct</option>
                            <option value="wrong">Wrong</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </label>
                        {inject.choices.length > 2 && <Button type="button" variant="ghost" size="sm" aria-label={`Remove choice ${choiceIndex + 1}`} onClick={() => updateInject(index, { choices: inject.choices.filter((_, itemIndex) => itemIndex !== choiceIndex) })}><Trash2 className="size-4" /></Button>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 rounded-lg border border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">Discussion points (optional)</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => updateInject(index, { discussionPoints: [...inject.discussionPoints, { role: '', prompt: '' }] })}><Plus className="size-4" /> Add discussion point</Button>
                    </div>
                    {inject.discussionPoints.map((point, pointIndex) => (
                      <div key={pointIndex} className="grid gap-3 sm:grid-cols-[0.8fr_1.5fr_auto] sm:items-end">
                        <label className="block space-y-1.5 text-sm font-medium">
                          <span>Role to prompt</span>
                          <select
                            value={point.role}
                            onChange={(event) => updateInject(index, { discussionPoints: updateAt(inject.discussionPoints, pointIndex, { role: event.target.value }) })}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Choose a role</option>
                            {draft.roles.filter((role) => role.title.trim()).map((role, roleIndex) => (
                              <option key={roleIndex} value={role.title.trim()}>{role.title.trim()}</option>
                            ))}
                          </select>
                        </label>
                        <Field label="Discussion prompt" value={point.prompt} rows={2} placeholder="Question to guide discussion" onChange={(prompt) => updateInject(index, { discussionPoints: updateAt(inject.discussionPoints, pointIndex, { prompt }) })} />
                        <Button type="button" variant="ghost" size="sm" aria-label={`Remove discussion point ${pointIndex + 1}`} onClick={() => updateInject(index, { discussionPoints: inject.discussionPoints.filter((_, itemIndex) => itemIndex !== pointIndex) })}><Trash2 className="size-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Facilitator notes (optional)" value={inject.facilitatorNotes} rows={3} placeholder="What should the facilitator listen for?" onChange={(facilitatorNotes) => updateInject(index, { facilitatorNotes })} />
                    <Field label="Hint (optional)" value={inject.hint} rows={3} placeholder="Optional nudge if discussion gets stuck." onChange={(hint) => updateInject(index, { hint })} />
                  </div>
                  <ImageField
                    label={isEditing ? 'Replace inject image (optional)' : 'Inject image (optional)'}
                    value={inject.imageData}
                    onChange={(imageData) => updateInject(index, { imageData })}
                    onError={setError}
                  />
                  {isEditing && inject.imageUrl && !inject.imageData && (
                    <img src={inject.imageUrl} alt={`Current image for Inject ${index + 1}`} className="max-h-48 w-auto max-w-full rounded-lg border border-border object-contain" />
                  )}
                </article>
              ))}
              <Button type="button" variant="outline" onClick={() => setDraft((current) => ({ ...current, injects: [...current.injects, { ...EMPTY_INJECT, minute: Math.min(current.durationMinutes, 10 * (current.injects.length + 1)) }] }))}><Plus className="size-4" /> Add inject</Button>
            </div>
          </>
        )}

        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <Button type="button" variant="outline" onClick={() => { setError(null); setStep((current) => Math.max(0, current - 1)) }} disabled={step === 0 || saving}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>Continue <ArrowRight className="size-4" /></Button>
          ) : (
            <Button type="button" onClick={saveExercise} disabled={saving}>
              {saving ? 'Saving exercise...' : isEditing ? 'Save changes' : 'Create exercise'}
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
