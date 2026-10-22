'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createClientId } from './client-id'
import { EXERCISE_META, TIMELINE, type RoleId } from './exercise-data'

export interface Decision {
  id: string
  decision: string
  team: string
  time: string
  reason: string
  outcome: string
  createdAt: number
}

export interface Participant {
  id: string
  deviceId: string
  name: string
  roleId: RoleId
}

export interface Settings {
  title: string
  organization: string
  facilitator: string
  durationMinutes: number
  theme: 'dark' | 'light'
  autoSave: boolean
  sound: boolean
  logoDataUrl: string | null
}

export interface ParticipantResponse {
  id: string
  participantId: string
  injectId: string
  choice: string
  submittedAt: number
}

export interface ExerciseState {
  settings: Settings
  running: boolean
  elapsedSeconds: number
  completedInjects: string[]
  participants: Participant[]
  currentParticipantId: string | null
  activeInjectId: string | null
  facilitatorPhase: 'signup' | 'activeInject'
  responses: ParticipantResponse[]
  decisions: Decision[]
  scores: Record<string, number>
  aarNotes: {
    executiveSummary: string
    strengths: string
    improvements: string
    lessons: string
    recommendations: string
  }
  actionItems: ActionItem[]
}

export interface ActionItem {
  id: string
  action: string
  owner: string
  dueDate: string
  priority: 'High' | 'Medium' | 'Low'
}

const defaultState: ExerciseState = {
  settings: {
    title: EXERCISE_META.defaultTitle,
    organization: EXERCISE_META.defaultOrg,
    facilitator: EXERCISE_META.defaultFacilitator,
    durationMinutes: EXERCISE_META.defaultDurationMinutes,
    theme: 'light',
    autoSave: true,
    sound: true,
    logoDataUrl: null,
  },
  running: false,
  elapsedSeconds: 0,
  completedInjects: [],
  participants: [],
  currentParticipantId: null,
  activeInjectId: null,
  facilitatorPhase: 'signup',
  responses: [],
  decisions: [],
  scores: {},
  aarNotes: {
    executiveSummary: '',
    strengths: '',
    improvements: '',
    lessons: '',
    recommendations: '',
  },
  actionItems: [],
}

const persistedKeys = [
  'settings',
  'activeInjectId',
  'completedInjects',
  'facilitatorPhase',
  'decisions',
  'scores',
  'aarNotes',
  'actionItems',
] as const satisfies readonly (keyof ExerciseState)[]

let stateWriteQueue: Promise<void> = Promise.resolve()

interface StoreContextValue {
  state: ExerciseState
  hydrated: boolean
  syncError: string | null
  setSyncError: (error: string | null) => void
  start: () => void
  pause: () => void
  reset: () => void
  toggleInject: (id: string) => void
  addDecision: (d: Omit<Decision, 'id' | 'createdAt'>) => void
  removeDecision: (id: string) => void
  addParticipant: (p: Omit<Participant, 'id'>) => void
  removeParticipant: (id: string) => void
  setActiveInject: (injectId: string | null) => void
  setFacilitatorPhase: (phase: ExerciseState['facilitatorPhase']) => void
  submitResponse: (injectId: string, choice: string) => Promise<void>
  setScore: (categoryId: string, value: number) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateAarNotes: (patch: Partial<ExerciseState['aarNotes']>) => void
  addActionItem: (a: Omit<ActionItem, 'id'>) => void
  removeActionItem: (id: string) => void
  resetAll: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.42)
  } catch {
    // ignore audio failures
  }
}

async function fetchStateFromServer(): Promise<Partial<ExerciseState>> {
  const response = await fetch('/api/exercise-state', { cache: 'no-store' })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Exercise state request failed (${response.status})`)
  }
  return (await response.json()) as Partial<ExerciseState>
}

function deepMergeClient(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMergeClient(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      )
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue
    }
  }

  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

async function pushStateToServer(patch: Record<string, unknown>): Promise<void> {
  const write = stateWriteQueue.then(async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const response = await fetch('/api/exercise-state', {
      method: 'POST',
      headers,
      body: JSON.stringify(patch),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(body?.error ?? `Exercise state save failed (${response.status})`)
    }
  })
  stateWriteQueue = write.catch(() => {})
  return write
}

function mergeExerciseState(
  previous: ExerciseState,
  remote: Partial<ExerciseState>
): ExerciseState {
  return {
    ...previous,
    ...remote,
    settings: { ...previous.settings, ...(remote.settings as Partial<Settings>) },
    aarNotes: {
      ...previous.aarNotes,
      ...(remote.aarNotes as Partial<ExerciseState['aarNotes']>),
    },
  }
}

function statesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diffObject(previous: Record<string, unknown>, current: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(current)) {
    const oldValue = previous[key]
    if (statesEqual(oldValue, value)) continue
    if (isPlainObject(oldValue) && isPlainObject(value)) {
      const nested = diffObject(oldValue, value)
      if (Object.keys(nested).length > 0) patch[key] = nested
    } else {
      patch[key] = value
    }
  }
  return patch
}

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExerciseState>(defaultState)
  const stateRef = useRef(state)
  stateRef.current = state
  const [hydrated, setHydrated] = useState(false)
  const [serverReady, setServerReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const notifiedRef = useRef<Set<number>>(new Set())
  const lastSyncedStateRef = useRef<ExerciseState | null>(null)
  const pendingWritesRef = useRef(0)
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const remote = await fetchStateFromServer()
        if (cancelled) return
        const initialState = mergeExerciseState(defaultState, remote)
        lastSyncedStateRef.current = initialState
        setState(initialState)
        setServerReady(true)
        setSyncError(null)
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Could not connect to exercise storage')
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated || serverReady) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const remote = await fetchStateFromServer()
        if (cancelled) return
        const initialState = mergeExerciseState(defaultState, remote)
        lastSyncedStateRef.current = initialState
        setState(initialState)
        setServerReady(true)
        setSyncError(null)
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Could not connect to exercise storage')
        }
      }
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [hydrated, serverReady])

  useEffect(() => {
    if (!hydrated || !serverReady || !state.settings.autoSave) return

    const lastSyncedState = lastSyncedStateRef.current
    if (!lastSyncedState) return
    const patch = diffObject(
      Object.fromEntries(persistedKeys.map((key) => [key, lastSyncedState[key]])),
      Object.fromEntries(persistedKeys.map((key) => [key, state[key]])),
    )
    if (Object.keys(patch).length === 0) return

    pendingWritesRef.current += 1
    pushStateToServer(patch).then(
      () => {
        lastSyncedStateRef.current = deepMergeClient(
          (lastSyncedStateRef.current ?? defaultState) as unknown as Record<string, unknown>,
          patch,
        ) as unknown as ExerciseState
        setSyncError(null)
      },
      (error: unknown) => {
        setSyncError(error instanceof Error ? error.message : 'Could not save exercise state')
      },
    ).finally(() => {
      pendingWritesRef.current -= 1
    })
  }, [
    hydrated,
    serverReady,
    state.settings.autoSave,
    state.settings,
    state.activeInjectId,
    state.completedInjects,
    state.facilitatorPhase,
    state.decisions,
    state.scores,
    state.aarNotes,
    state.actionItems,
  ])

  useEffect(() => {
    if (!hydrated || !serverReady) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const remote = await fetchStateFromServer()
        if (cancelled) return
        if (pendingWritesRef.current > 0) return
        const currentState = lastSyncedStateRef.current
        const remoteState = mergeExerciseState(defaultState, remote)
        if (
          currentState &&
          persistedKeys.some((key) => !statesEqual(stateRef.current[key], currentState[key]))
        ) {
          return
        }

        lastSyncedStateRef.current = remoteState
        setState((prev) => mergeExerciseState(prev, remoteState))
        setSyncError(null)
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Could not refresh exercise state')
        }
      }
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [hydrated, serverReady])

  // Apply theme to <html>
  useEffect(() => {
    if (!hydrated) return
    const root = document.documentElement
    if (state.settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [state.settings.theme, hydrated])

  // Timer tick
  useEffect(() => {
    if (!state.running) return
    const total = state.settings.durationMinutes * 60
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.running) return prev
        const next = Math.min(prev.elapsedSeconds + 1, total)
        return { ...prev, elapsedSeconds: next, running: next >= total ? false : prev.running }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state.running, state.settings.durationMinutes])

  // Inject notifications on crossing timeline minutes
  useEffect(() => {
    if (!state.running || !state.settings.sound) return
    const minute = Math.floor(state.elapsedSeconds / 60)
    const seconds = state.elapsedSeconds % 60
    if (seconds !== 0) return
    const event = TIMELINE.find((t) => t.minute === minute && t.injectId)
    if (event && !notifiedRef.current.has(minute)) {
      notifiedRef.current.add(minute)
      playBeep()
    }
  }, [state.elapsedSeconds, state.running, state.settings.sound])

  const start = useCallback(() => setState((p) => ({ ...p, running: true })), [])
  const pause = useCallback(() => setState((p) => ({ ...p, running: false })), [])
  const reset = useCallback(() => {
    notifiedRef.current.clear()
    setState((p) => ({ ...p, running: false, elapsedSeconds: 0 }))
  }, [])

  const toggleInject = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      completedInjects: p.completedInjects.includes(id)
        ? p.completedInjects.filter((x) => x !== id)
        : [...p.completedInjects, id],
    }))
  }, [])

  const addDecision = useCallback((d: Omit<Decision, 'id' | 'createdAt'>) => {
    setState((p) => ({
      ...p,
      decisions: [
        ...p.decisions,
        { ...d, id: createClientId(), createdAt: Date.now() },
      ],
    }))
  }, [])

  const removeDecision = useCallback((id: string) => {
    setState((p) => ({ ...p, decisions: p.decisions.filter((d) => d.id !== id) }))
  }, [])

  const addParticipant = useCallback((p: Omit<Participant, 'id'>) => {
    setState((prev) => {
      const exists = prev.participants.some((participant) => participant.deviceId === p.deviceId)
      if (exists) return { ...prev, currentParticipantId: p.deviceId }
      return {
        ...prev,
        currentParticipantId: p.deviceId,
        participants: [...prev.participants, { ...p, id: createClientId() }],
      }
    })
  }, [])

  const removeParticipant = useCallback((id: string) => {
    setState((p) => ({ ...p, participants: p.participants.filter((participant) => participant.id !== id) }))
  }, [])

  const setActiveInject = useCallback((injectId: string | null) => {
    setState((p) => ({ ...p, activeInjectId: injectId }))
  }, [])

  const setFacilitatorPhase = useCallback((phase: ExerciseState['facilitatorPhase']) => {
    setState((p) => ({ ...p, facilitatorPhase: phase }))
  }, [])

  const submitResponse = useCallback(async (injectId: string, choice: string) => {
    try {
      const response = await fetch('/api/exercise-state/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ injectId, choice }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Response save failed (${response.status})`)
      }
      const result = (await response.json()) as { response: ParticipantResponse }
      if (stateRef.current.currentParticipantId !== result.response.participantId) {
        throw new Error('The saved response does not match this participant session. Please join again.')
      }
      setState((previous) => ({
        ...previous,
        responses: [
          ...previous.responses.filter(
            (item) => !(item.participantId === result.response.participantId && item.injectId === injectId),
          ),
          result.response,
        ],
      }))
      setSyncError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save participant response'
      setSyncError(message)
      throw new Error(message)
    }
  }, [])

  const setScore = useCallback((categoryId: string, value: number) => {
    setState((p) => ({ ...p, scores: { ...p.scores, [categoryId]: value } }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((p) => {
      const next = { ...p, settings: { ...p.settings, ...patch } }
      return next
    })
  }, [])

  const updateAarNotes = useCallback((patch: Partial<ExerciseState['aarNotes']>) => {
    setState((p) => ({ ...p, aarNotes: { ...p.aarNotes, ...patch } }))
  }, [])

  const addActionItem = useCallback((a: Omit<ActionItem, 'id'>) => {
    setState((p) => ({ ...p, actionItems: [...p.actionItems, { ...a, id: createClientId() }] }))
  }, [])

  const removeActionItem = useCallback((id: string) => {
    setState((p) => ({ ...p, actionItems: p.actionItems.filter((a) => a.id !== id) }))
  }, [])

  const resetAll = useCallback(() => {
    notifiedRef.current.clear()
    const emptyState = { ...defaultState, settings: state.settings } as ExerciseState
    setState(emptyState)
    pushStateToServer({
      settings: emptyState.settings,
      participants: [],
      responses: [],
      activeInjectId: null,
      completedInjects: [],
      facilitatorPhase: 'signup',
      decisions: [],
      scores: {},
      aarNotes: emptyState.aarNotes,
      actionItems: [],
      running: false,
      elapsedSeconds: 0,
    }).then(
      () => {
        lastSyncedStateRef.current = emptyState
        setSyncError(null)
      },
      (error: unknown) => {
        setSyncError(error instanceof Error ? error.message : 'Could not reset exercise state')
      },
    )
    try {
      localStorage.removeItem('cyber-exercise-device-id')
    } catch {
      // ignore
    }
  }, [state.settings])

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
      syncError,
      setSyncError,
      start,
      pause,
      reset,
      toggleInject,
      addDecision,
      removeDecision,
      addParticipant,
      removeParticipant,
      setActiveInject,
      setFacilitatorPhase,
      submitResponse,
      setScore,
      updateSettings,
      updateAarNotes,
      addActionItem,
      removeActionItem,
      resetAll,
    }),
    [
      state,
      hydrated,
      syncError,
      start,
      pause,
      reset,
      toggleInject,
      addDecision,
      removeDecision,
      addParticipant,
      removeParticipant,
      setActiveInject,
      setFacilitatorPhase,
      submitResponse,
      setScore,
      updateSettings,
      updateAarNotes,
      addActionItem,
      removeActionItem,
      resetAll,
    ],
  )

  return (
    <StoreContext.Provider value={value}>
      {syncError ? (
        <div role="alert" className="border-b border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Exercise data is not syncing: {syncError}
        </div>
      ) : null}
      {children}
    </StoreContext.Provider>
  )
}

export function useExercise() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useExercise must be used within ExerciseProvider')
  return ctx
}

// Derived selectors
export function useTimerInfo() {
  const { state } = useExercise()
  const total = state.settings.durationMinutes * 60
  const remaining = Math.max(total - state.elapsedSeconds, 0)
  const progress = total > 0 ? (state.elapsedSeconds / total) * 100 : 0
  const minute = Math.floor(state.elapsedSeconds / 60)
  return { total, remaining, progress, minute, elapsed: state.elapsedSeconds, running: state.running }
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
