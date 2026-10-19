import { randomUUID } from 'crypto'
import { Pool, type PoolClient } from 'pg'
import { EXERCISE_META } from './exercise-data'
import type { ExerciseState, Participant, ParticipantResponse } from './exercise-store'

declare global {
  var exerciseDatabasePool: Pool | undefined
}

function getPool() {
  if (globalThis.exerciseDatabasePool) return globalThis.exerciseDatabasePool

  const pool = new Pool({
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  })
  globalThis.exerciseDatabasePool = pool
  return pool
}

export function createDefaultExerciseState(): ExerciseState {
  return {
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
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  const result = { ...target }
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key]
    result[key] =
      isPlainObject(sourceValue) && isPlainObject(targetValue)
        ? deepMerge(targetValue, sourceValue)
        : sourceValue
  }
  return result
}

async function lockAndRead(client: PoolClient): Promise<ExerciseState> {
  await client.query('SELECT pg_advisory_xact_lock($1)', [741920681])
  const result = await client.query<{ state: ExerciseState }>(
    'SELECT state FROM exercise_state WHERE id = 1'
  )
  if (result.rows[0]) return result.rows[0].state

  const initialState = createDefaultExerciseState()
  await client.query(
    'INSERT INTO exercise_state (id, state) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(initialState)]
  )
  return initialState
}

async function transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getExerciseState(): Promise<ExerciseState> {
  const result = await getPool().query<{ state: ExerciseState }>(
    'SELECT state FROM exercise_state WHERE id = 1'
  )
  return result.rows[0]?.state ?? createDefaultExerciseState()
}

export async function patchExerciseState(
  patch: Record<string, unknown>
): Promise<ExerciseState> {
  return transaction(async (client) => {
    const current = await lockAndRead(client)
    const merged = deepMerge(current as unknown as Record<string, unknown>, patch)
    await client.query(
      `INSERT INTO exercise_state (id, state, version, updated_at)
       VALUES (1, $1::jsonb, 1, now())
       ON CONFLICT (id) DO UPDATE
       SET state = EXCLUDED.state,
           version = exercise_state.version + 1,
           updated_at = now()`,
      [JSON.stringify(merged)]
    )
    return merged as unknown as ExerciseState
  })
}

export async function joinExercise(
  input: Pick<Participant, 'deviceId' | 'name' | 'roleId'>
): Promise<{ participant: Participant; totalParticipants: number }> {
  return transaction(async (client) => {
    const state = await lockAndRead(client)
    const participants = state.participants ?? []
    let participant = participants.find((item) => item.deviceId === input.deviceId)

    if (!participant) {
      participant = { ...input, id: randomUUID() }
      participants.push(participant)
    }

    const nextState = { ...state, participants }
    await client.query(
      `INSERT INTO exercise_state (id, state, version, updated_at)
       VALUES (1, $1::jsonb, 1, now())
       ON CONFLICT (id) DO UPDATE
       SET state = EXCLUDED.state,
           version = exercise_state.version + 1,
           updated_at = now()`,
      [JSON.stringify(nextState)]
    )
    return { participant, totalParticipants: participants.length }
  })
}

export async function submitExerciseResponse(
  input: Pick<ParticipantResponse, 'participantId' | 'injectId' | 'choice'>
): Promise<{ totalResponses: number }> {
  return transaction(async (client) => {
    const state = await lockAndRead(client)
    const responses = state.responses ?? []
    const exists = responses.some(
      (response) =>
        response.participantId === input.participantId && response.injectId === input.injectId
    )

    if (!exists) {
      responses.push({ ...input, id: randomUUID(), submittedAt: Date.now() })
    }

    const nextState = { ...state, responses }
    await client.query(
      `INSERT INTO exercise_state (id, state, version, updated_at)
       VALUES (1, $1::jsonb, 1, now())
       ON CONFLICT (id) DO UPDATE
       SET state = EXCLUDED.state,
           version = exercise_state.version + 1,
           updated_at = now()`,
      [JSON.stringify(nextState)]
    )
    return { totalResponses: responses.length }
  })
}
