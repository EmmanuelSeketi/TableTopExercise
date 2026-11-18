'use client'

import { useSyncExternalStore } from 'react'
import { EXERCISE_IDS, getExerciseDefinition, getExerciseIdFromUrl } from './exercise-instances'

function subscribeToExerciseId(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getBrowserExerciseId() {
  return getExerciseIdFromUrl(window.location.href) ?? EXERCISE_IDS.meridian
}

export function useExerciseDefinition() {
  const id = useSyncExternalStore(subscribeToExerciseId, getBrowserExerciseId, () => EXERCISE_IDS.meridian)
  return getExerciseDefinition(id)
}

export function exerciseApiUrl(path: string) {
  if (typeof window === 'undefined') return path
  const id = getBrowserExerciseId()
  return `${path}?exercise=${encodeURIComponent(id)}`
}
