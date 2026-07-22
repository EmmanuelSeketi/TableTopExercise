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

const STORAGE_KEY = 'sentinel-ir-exercise-v1'

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

interface StoreContextValue {
  state: ExerciseState
  hydrated: boolean
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
  submitResponse: (participantId: string, injectId: string, choice: string) => void
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

async function fetchStateFromServer(): Promise<Partial<ExerciseState> | null> {
  try {
    const response = await fetch('/api/exercise-state', { cache: 'no-store' })
    if (!response.ok) return null
    return (await response.json()) as Partial<ExerciseState>
  } catch {
    return null
  }
}

async function pushStateToServer(patch: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/exercise-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  } catch {
    // ignore write failures
  }
}

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExerciseState>(defaultState)
  const [hydrated, setHydrated] = useState(false)
  const notifiedRef = useRef<Set<number>>(new Set())
  const serverHydrated = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const remote = await fetchStateFromServer()
      if (cancelled) return

      if (remote) {
        setState((prev) => ({
          ...prev,
          ...remote,
          settings: { ...prev.settings, ...(remote.settings as Partial<Settings>) },
          aarNotes: { ...prev.aarNotes, ...(remote.aarNotes as Partial<ExerciseState['aarNotes']>) },
        }))
        serverHydrated.current = true
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<ExerciseState>
            setState((prev) => ({
              ...prev,
              ...parsed,
              settings: { ...prev.settings, ...parsed.settings },
              aarNotes: { ...prev.aarNotes, ...parsed.aarNotes },
            }))
          }
        } catch {
          // ignore malformed storage
        }
      }

      setHydrated(true)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!serverHydrated.current) return
    if (!state.settings.autoSave) return

    const patch = {
      settings: state.settings,
      participants: state.participants,
      responses: state.responses,
      activeInjectId: state.activeInjectId,
      completedInjects: state.completedInjects,
      facilitatorPhase: state.facilitatorPhase,
      decisions: state.decisions,
      scores: state.scores,
      aarNotes: state.aarNotes,
      actionItems: state.actionItems,
      running: state.running,
      elapsedSeconds: state.elapsedSeconds,
    }

    pushStateToServer(patch)

    const interval = setInterval(async () => {
      const remote = await fetchStateFromServer()
      if (!remote) return
      setState((prev) => ({
        ...prev,
        ...remote,
        settings: { ...prev.settings, ...(remote.settings as Partial<Settings>) },
        aarNotes: { ...prev.aarNotes, ...(remote.aarNotes as Partial<ExerciseState['aarNotes']>) },
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [
    hydrated,
    state.settings.autoSave,
    state.settings,
    state.participants,
    state.responses,
    state.activeInjectId,
    state.completedInjects,
    state.facilitatorPhase,
    state.decisions,
    state.scores,
    state.aarNotes,
    state.actionItems,
    state.running,
    state.elapsedSeconds,
  ])

  useEffect(() => {
    if (!serverHydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [state])

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
        { ...d, id: crypto.randomUUID(), createdAt: Date.now() },
      ],
    }))
  }, [])

  const removeDecision = useCallback((id: string) => {
    setState((p) => ({ ...p, decisions: p.decisions.filter((d) => d.id !== id) }))
  }, [])

  const addParticipant = useCallback((p: Omit<Participant, 'id'>) => {
    setState((prev) => {
      const exists = prev.participants.some((participant) => participant.deviceId === p.deviceId)
      if (exists) return prev
      return {
        ...prev,
        participants: [...prev.participants, { ...p, id: crypto.randomUUID() }],
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

  const submitResponse = useCallback((participantId: string, injectId: string, choice: string) => {
    setState((p) => {
      const alreadySubmitted = p.responses.some((r) => r.participantId === participantId && r.injectId === injectId)
      if (alreadySubmitted) return p
      return {
        ...p,
        responses: [
          ...p.responses,
          {
            id: crypto.randomUUID(),
            participantId,
            injectId,
            choice,
            submittedAt: Date.now(),
          },
        ],
      }
    })
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
    setState((p) => ({ ...p, actionItems: [...p.actionItems, { ...a, id: crypto.randomUUID() }] }))
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
    })
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('cyber-exercise-device-id')
    } catch {
      // ignore
    }
  }, [state.settings])

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
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

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
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
