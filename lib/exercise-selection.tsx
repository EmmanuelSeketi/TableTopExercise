'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  EXERCISE_IDS,
  getExerciseDefinition,
  getExerciseIdFromUrl,
  isBuiltInExerciseId,
  isCustomExerciseId,
  type ExerciseDefinition,
} from './exercise-instances'
import type { ExerciseCatalogItem, ExerciseCatalogResponse } from './custom-exercise-types'

function subscribeToExerciseId(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getBrowserExerciseId() {
  return getExerciseIdFromUrl(window.location.href) ?? EXERCISE_IDS.meridian
}

export function useExerciseId() {
  return useSyncExternalStore(subscribeToExerciseId, getBrowserExerciseId, () => EXERCISE_IDS.meridian)
}

interface ExerciseRegistry {
  definitions: Record<string, ExerciseDefinition>
  catalog: ExerciseCatalogItem[]
  deletedExerciseIds: string[]
  catalogReady: boolean
  error: string | null
}

const ExerciseRegistryContext = createContext<ExerciseRegistry>({
  definitions: {},
  catalog: [],
  deletedExerciseIds: [],
  catalogReady: false,
  error: null,
})

export function ExerciseRegistryProvider({ children }: { children: React.ReactNode }) {
  const exerciseId = useExerciseId()
  const [definitions, setDefinitions] = useState<Record<string, ExerciseDefinition>>({})
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([])
  const [deletedExerciseIds, setDeletedExerciseIds] = useState<string[]>([])
  const [catalogReady, setCatalogReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadCatalog() {
      try {
        const response = await fetch('/api/exercises', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Exercise catalog request failed (${response.status})`)
        const result = (await response.json()) as ExerciseCatalogResponse
        if (
          !result ||
          !Array.isArray(result.customExercises) ||
          !Array.isArray(result.builtInOverrides) ||
          !Array.isArray(result.deletedExerciseIds)
        ) throw new Error('Exercise catalog response was invalid')
        if (!cancelled) {
          setCatalog(result.customExercises)
          setDeletedExerciseIds(result.deletedExerciseIds)
          setDefinitions((current) => ({
            ...current,
            ...Object.fromEntries(result.builtInOverrides.map((definition) => [definition.id, definition])),
          }))
          setCatalogReady(true)
          setError(null)
        }
      } catch (caught) {
        if (!cancelled) {
          setCatalogReady(true)
          setError(caught instanceof Error ? caught.message : 'Could not load custom exercises')
        }
      }
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isCustomExerciseId(exerciseId) || definitions[exerciseId]) return
    let cancelled = false

    async function loadDefinition() {
      try {
        const response = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Exercise definition request failed (${response.status})`)
        const definition = (await response.json()) as ExerciseDefinition
        if (definition.id !== exerciseId) throw new Error('Exercise definition did not match the selected exercise')
        if (!cancelled) {
          setDefinitions((current) => ({ ...current, [exerciseId]: definition }))
          setError(null)
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load the selected exercise')
        }
      }
    }

    loadDefinition()
    return () => {
      cancelled = true
    }
  }, [exerciseId, definitions])

  const value = useMemo(
    () => ({ definitions, catalog, deletedExerciseIds, catalogReady, error }),
    [definitions, catalog, deletedExerciseIds, catalogReady, error],
  )

  return (
    <ExerciseRegistryContext.Provider value={value}>
      {error && (
        <div role="alert" className="border-b border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Exercise catalog: {error}
        </div>
      )}
      {children}
    </ExerciseRegistryContext.Provider>
  )
}

export function useExerciseDefinitionState() {
  const exerciseId = useExerciseId()
  const registry = useContext(ExerciseRegistryContext)
  const customDefinition = registry.definitions[exerciseId]
  return {
    definition: customDefinition ?? getExerciseDefinition(exerciseId),
    ready: isCustomExerciseId(exerciseId)
      ? Boolean(customDefinition)
      : !isBuiltInExerciseId(exerciseId) || registry.catalogReady,
  }
}

export function useExerciseDefinition() {
  return useExerciseDefinitionState().definition
}

export function useExerciseCatalog() {
  const { catalog, deletedExerciseIds, definitions, catalogReady, error } = useContext(ExerciseRegistryContext)
  return {
    catalog,
    deletedExerciseIds,
    builtInDefinitions: definitions,
    catalogReady,
    error,
  }
}

export function useExerciseSelectionReady() {
  const urlReady = useSyncExternalStore(subscribeToExerciseId, () => true, () => false)
  const { ready: definitionReady } = useExerciseDefinitionState()
  return urlReady && definitionReady
}

export function exerciseApiUrl(path: string) {
  if (typeof window === 'undefined') return path
  const id = getBrowserExerciseId()
  return `${path}?exercise=${encodeURIComponent(id)}`
}
