import { randomUUID } from 'crypto'
import { Pool, type PoolClient } from 'pg'
import { EXERCISE_META } from './exercise-data'
import type { ExerciseState, Participant, ParticipantResponse } from './exercise-store'

declare global {
  var exerciseDatabasePool: Pool | undefined
}

let responseStorageReady: Promise<void> | null = null

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

async function ensureResponseStorage(): Promise<void> {
  if (responseStorageReady) return responseStorageReady

  const migration = (async () => {
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      await client.query(`
        CREATE TABLE IF NOT EXISTS exercise_responses (
          id text PRIMARY KEY,
          participant_id text NOT NULL,
          inject_id text NOT NULL,
          choice text NOT NULL,
          submitted_at bigint NOT NULL,
          UNIQUE (participant_id, inject_id)
        )
      `)
      await client.query(`
        INSERT INTO exercise_responses (id, participant_id, inject_id, choice, submitted_at)
        SELECT
          response->>'id',
          response->>'participantId',
          response->>'injectId',
          response->>'choice',
          (response->>'submittedAt')::bigint
        FROM exercise_state
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(state->'responses') = 'array' THEN state->'responses'
            ELSE '[]'::jsonb
          END
        ) AS response
        WHERE COALESCE(response->>'id', '') <> ''
          AND COALESCE(response->>'participantId', '') <> ''
          AND COALESCE(response->>'injectId', '') <> ''
          AND COALESCE(response->>'choice', '') <> ''
          AND (response->>'submittedAt') ~ '^[0-9]+$'
        ON CONFLICT DO NOTHING
      `)
      await client.query(`
        UPDATE exercise_state
        SET state = jsonb_set(state, '{responses}', '[]'::jsonb, true)
        WHERE jsonb_typeof(state->'responses') = 'array'
          AND jsonb_array_length(state->'responses') > 0
      `)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })()

  responseStorageReady = migration.catch((error: unknown) => {
    responseStorageReady = null
    throw error
  })
  return responseStorageReady
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
  await ensureResponseStorage()
  const result = await getPool().query<{ state: ExerciseState }>(
    'SELECT state FROM exercise_state WHERE id = 1'
  )
  const state = result.rows[0]?.state ?? createDefaultExerciseState()
  const responses = await getPool().query<ParticipantResponse>(
    `SELECT
       id,
       participant_id AS "participantId",
       inject_id AS "injectId",
       choice,
       submitted_at::double precision AS "submittedAt"
     FROM exercise_responses
     ORDER BY submitted_at, id`
  )
  return { ...state, responses: responses.rows }
}

export async function patchExerciseState(
  patch: Record<string, unknown>
): Promise<ExerciseState> {
  await ensureResponseStorage()
  return transaction(async (client) => {
    const current = await lockAndRead(client)
    const merged = deepMerge(current as unknown as Record<string, unknown>, patch)
    if (Array.isArray(patch.responses)) {
      await client.query('DELETE FROM exercise_responses')
      for (const response of patch.responses) {
        if (
          typeof response !== 'object' ||
          response === null ||
          typeof response.id !== 'string' ||
          typeof response.participantId !== 'string' ||
          typeof response.injectId !== 'string' ||
          typeof response.choice !== 'string' ||
          typeof response.submittedAt !== 'number'
        ) {
          throw new Error('Invalid participant response in state patch')
        }
        await client.query(
          `INSERT INTO exercise_responses (id, participant_id, inject_id, choice, submitted_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (participant_id, inject_id) DO NOTHING`,
          [response.id, response.participantId, response.injectId, response.choice, response.submittedAt],
        )
      }
    }
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
  await ensureResponseStorage()
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
): Promise<{ response: ParticipantResponse; totalResponses: number }> {
  await ensureResponseStorage()
  return transaction(async (client) => {
    const submittedAt = Date.now()
    const inserted = await client.query<ParticipantResponse>(
      `INSERT INTO exercise_responses (id, participant_id, inject_id, choice, submitted_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (participant_id, inject_id) DO NOTHING
       RETURNING
         id,
         participant_id AS "participantId",
         inject_id AS "injectId",
         choice,
         submitted_at::double precision AS "submittedAt"`,
      [randomUUID(), input.participantId, input.injectId, input.choice, submittedAt],
    )
    const savedResponse = inserted.rows[0] ?? (
      await client.query<ParticipantResponse>(
        `SELECT
           id,
           participant_id AS "participantId",
           inject_id AS "injectId",
           choice,
           submitted_at::double precision AS "submittedAt"
         FROM exercise_responses
         WHERE participant_id = $1 AND inject_id = $2`,
        [input.participantId, input.injectId],
      )
    ).rows[0]
    if (!savedResponse) throw new Error('Could not load the saved participant response')
    const count = await client.query<{ total: string }>(
      'SELECT count(*)::text AS total FROM exercise_responses',
    )
    return { response: savedResponse, totalResponses: Number(count.rows[0]?.total ?? 0) }
  })
}
