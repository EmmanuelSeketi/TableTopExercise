import { randomUUID } from 'crypto'
import { Pool, type PoolClient } from 'pg'
import { getExerciseDefinition } from './exercise-instances'
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

async function ensureExerciseStorage(): Promise<void> {
  if (responseStorageReady) return responseStorageReady

  const migration = (async () => {
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      await client.query(`
        CREATE TABLE IF NOT EXISTS exercise_instance_states (
          instance_id text PRIMARY KEY,
          state jsonb NOT NULL,
          version bigint NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await client.query(`
        INSERT INTO exercise_instance_states (instance_id, state, version, updated_at)
        SELECT 'meridian', jsonb_set(state, '{responses}', '[]'::jsonb, true), version, updated_at
        FROM exercise_state
        WHERE id = 1
        ON CONFLICT (instance_id) DO NOTHING
      `)
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
      await client.query(`
        CREATE TABLE IF NOT EXISTS exercise_instance_responses (
          id text PRIMARY KEY,
          instance_id text NOT NULL,
          participant_id text NOT NULL,
          inject_id text NOT NULL,
          choice text NOT NULL,
          submitted_at bigint NOT NULL,
          UNIQUE (instance_id, participant_id, inject_id)
        )
      `)
      await client.query(`
        INSERT INTO exercise_instance_responses (id, instance_id, participant_id, inject_id, choice, submitted_at)
        SELECT id, 'meridian', participant_id, inject_id, choice, submitted_at
        FROM exercise_responses
        ON CONFLICT DO NOTHING
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
  const definition = getExerciseDefinition('meridian')
  return {
    settings: {
      title: definition.title,
      organization: definition.organization,
      facilitator: 'A. Rivera, CISM',
      durationMinutes: definition.durationMinutes,
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
}

function createInstanceDefaultState(instanceId: string): ExerciseState {
  const state = createDefaultExerciseState()
  const definition = getExerciseDefinition(instanceId)
  return {
    ...state,
    settings: {
      ...state.settings,
      title: definition.title,
      organization: definition.organization,
      durationMinutes: definition.durationMinutes,
    },
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

async function lockAndRead(client: PoolClient, instanceId: string): Promise<ExerciseState> {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('exercise:' || $1))", [instanceId])
  const result = await client.query<{ state: ExerciseState }>(
    'SELECT state FROM exercise_instance_states WHERE instance_id = $1',
    [instanceId],
  )
  if (result.rows[0]) return result.rows[0].state

  const initialState = createInstanceDefaultState(instanceId)
  await client.query(
    `INSERT INTO exercise_instance_states (instance_id, state)
     VALUES ($1, $2::jsonb) ON CONFLICT (instance_id) DO NOTHING`,
    [instanceId, JSON.stringify(initialState)]
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

export async function getExerciseState(instanceId: string): Promise<ExerciseState> {
  await ensureExerciseStorage()
  const result = await getPool().query<{ state: ExerciseState }>(
    'SELECT state FROM exercise_instance_states WHERE instance_id = $1',
    [instanceId],
  )
  const state = result.rows[0]?.state ?? createInstanceDefaultState(instanceId)
  const responses = await getPool().query<ParticipantResponse>(
    `SELECT
       id,
       participant_id AS "participantId",
       inject_id AS "injectId",
       choice,
       submitted_at::double precision AS "submittedAt"
     FROM exercise_instance_responses
     WHERE instance_id = $1
     ORDER BY submitted_at, id`,
    [instanceId],
  )
  return { ...state, responses: responses.rows }
}

export async function patchExerciseState(
  instanceId: string,
  patch: Record<string, unknown>
): Promise<ExerciseState> {
  await ensureExerciseStorage()
  return transaction(async (client) => {
    const current = await lockAndRead(client, instanceId)
    const merged = deepMerge(current as unknown as Record<string, unknown>, patch)
    if (Array.isArray(patch.responses)) {
      await client.query('DELETE FROM exercise_instance_responses WHERE instance_id = $1', [instanceId])
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
          `INSERT INTO exercise_instance_responses
             (id, instance_id, participant_id, inject_id, choice, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (instance_id, participant_id, inject_id) DO NOTHING`,
          [response.id, instanceId, response.participantId, response.injectId, response.choice, response.submittedAt],
        )
      }
    }
    await client.query(
      `INSERT INTO exercise_instance_states (instance_id, state, version, updated_at)
       VALUES ($1, $2::jsonb, 1, now())
       ON CONFLICT (instance_id) DO UPDATE
       SET state = EXCLUDED.state,
           version = exercise_instance_states.version + 1,
           updated_at = now()`,
      [instanceId, JSON.stringify(merged)]
    )
    return merged as unknown as ExerciseState
  })
}

export async function joinExercise(
  instanceId: string,
  input: Pick<Participant, 'deviceId' | 'name' | 'roleId' | 'customRole'>
): Promise<{ participant: Participant; totalParticipants: number }> {
  await ensureExerciseStorage()
  return transaction(async (client) => {
    const state = await lockAndRead(client, instanceId)
    const participants = state.participants ?? []
    let participant = participants.find((item) => item.deviceId === input.deviceId)

    if (!participant) {
      participant = { ...input, id: randomUUID() }
      participants.push(participant)
    }

    const nextState = { ...state, participants }
    await client.query(
      `INSERT INTO exercise_instance_states (instance_id, state, version, updated_at)
       VALUES ($1, $2::jsonb, 1, now())
       ON CONFLICT (instance_id) DO UPDATE
       SET state = EXCLUDED.state,
           version = exercise_instance_states.version + 1,
           updated_at = now()`,
      [instanceId, JSON.stringify(nextState)]
    )
    return { participant, totalParticipants: participants.length }
  })
}

export async function submitExerciseResponse(
  instanceId: string,
  input: Pick<ParticipantResponse, 'participantId' | 'injectId' | 'choice'>
): Promise<{ response: ParticipantResponse; totalResponses: number }> {
  await ensureExerciseStorage()
  return transaction(async (client) => {
    const submittedAt = Date.now()
    const inserted = await client.query<ParticipantResponse>(
      `INSERT INTO exercise_instance_responses (id, instance_id, participant_id, inject_id, choice, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (instance_id, participant_id, inject_id) DO NOTHING
       RETURNING
         id,
         participant_id AS "participantId",
         inject_id AS "injectId",
         choice,
         submitted_at::double precision AS "submittedAt"`,
      [randomUUID(), instanceId, input.participantId, input.injectId, input.choice, submittedAt],
    )
    const savedResponse = inserted.rows[0] ?? (
      await client.query<ParticipantResponse>(
        `SELECT
           id,
           participant_id AS "participantId",
           inject_id AS "injectId",
           choice,
           submitted_at::double precision AS "submittedAt"
         FROM exercise_instance_responses
         WHERE instance_id = $1 AND participant_id = $2 AND inject_id = $3`,
        [instanceId, input.participantId, input.injectId],
      )
    ).rows[0]
    if (!savedResponse) throw new Error('Could not load the saved participant response')
    const count = await client.query<{ total: string }>(
      'SELECT count(*)::text AS total FROM exercise_instance_responses WHERE instance_id = $1',
      [instanceId],
    )
    return { response: savedResponse, totalResponses: Number(count.rows[0]?.total ?? 0) }
  })
}
