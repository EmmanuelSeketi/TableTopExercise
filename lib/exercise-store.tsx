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
  // timer
  running: boolean
  elapsedSeconds: number
  // progress
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
  // timer
  start: () => void
  pause: () => void
  reset: () => void
  // injects
  toggleInject: (id: string) => void
  // decisions
  addDecision: (d: Omit<Decision, 'id' | 'createdAt'>) => void
  removeDecision: (id: string) => void
  // participants
  addParticipant: (p: Omit<Participant, 'id'>) => void
  removeParticipant: (id: string) => void
  // active inject / facilitator
  setActiveInject: (injectId: string | null) => void
  setFacilitatorPhase: (phase: ExerciseState['facilitatorPhase']) => void
  // participant responses
  submitResponse: (participantId: string, injectId: string, choice: string) => void
  // scores
  setScore: (categoryId: string, value: number) => void
  // settings
  updateSettings: (patch: Partial<Settings>) => void
  // aar
  updateAarNotes: (patch: Partial<ExerciseState['aarNotes']>) => void
  addActionItem: (a: Omit<ActionItem, 'id'>) => void
  removeActionItem: (id: string) => void
  // helpers
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

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExerciseState>(defaultState)
  const [hydrated, setHydrated] = useState(false)
  const notifiedRef = useRef<Set<number>>(new Set())

  // Hydrate from localStorage
  useEffect(() => {
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
    setHydrated(true)
  }, [])

  // Persist (respect autoSave)
  useEffect(() => {
    if (!hydrated) return
    if (!state.settings.autoSave) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return
      if (!event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as Partial<ExerciseState>
        setState((prev) => ({
          ...prev,
          ...parsed,
          settings: { ...prev.settings, ...parsed.settings },
          aarNotes: { ...prev.aarNotes, ...parsed.aarNotes },
        }))
      } catch {
        // ignore malformed storage
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

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
      // If autoSave turned off, we stop persisting; if turned on, persist immediately handled by effect
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
    setState((p) => ({ ...defaultState, settings: p.settings }))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

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
