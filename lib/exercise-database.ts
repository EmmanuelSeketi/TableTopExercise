import { randomUUID } from 'crypto'
import { Pool, type PoolClient } from 'pg'
import {
  EXERCISE_CHOICES,
  getExerciseDefinition,
  isBuiltInExerciseId,
  isCustomExerciseId,
  isManagedExerciseId,
} from './exercise-instances'
import type { CustomExerciseDraft } from './custom-exercise-types'
import type { ExerciseDefinition } from './exercise-instances'
import type { ExerciseState, Participant, ParticipantResponse } from './exercise-store'

declare global {
  var exerciseDatabasePool: Pool | undefined
}

let responseStorageReady: Promise<void> | null = null

export class CustomExerciseInputError extends Error {}

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
      await client.query(`
        CREATE TABLE IF NOT EXISTS custom_exercises (
          id text PRIMARY KEY,
          definition jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          archived_at timestamptz
        )
      `)
      await client.query('ALTER TABLE custom_exercises ADD COLUMN IF NOT EXISTS archived_at timestamptz')
      await client.query(`
        CREATE TABLE IF NOT EXISTS custom_exercise_media (
          id text PRIMARY KEY,
          exercise_id text NOT NULL REFERENCES custom_exercises(id) ON DELETE CASCADE,
          content_type text NOT NULL,
          image_data bytea NOT NULL
        )
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

function parseExerciseImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match) throw new CustomExerciseInputError('Images must be JPEG, PNG, or WebP files.')
  const imageData = Buffer.from(match[2], 'base64')
  if (imageData.length === 0 || imageData.length > 2 * 1024 * 1024 || imageData.toString('base64') !== match[2]) {
    throw new CustomExerciseInputError('Each uploaded image must be smaller than 2 MB.')
  }
  return { contentType: match[1], imageData }
}

async function saveExerciseImage(
  client: PoolClient,
  exerciseId: string,
  dataUrl: string | undefined,
  totalBytes: { value: number },
) {
  if (!dataUrl) return undefined
  const { contentType, imageData } = parseExerciseImage(dataUrl)
  totalBytes.value += imageData.length
  if (totalBytes.value > 8 * 1024 * 1024) {
    throw new CustomExerciseInputError('The combined image uploads must be smaller than 8 MB.')
  }
  const mediaId = randomUUID()
  await client.query(
    `INSERT INTO custom_exercise_media (id, exercise_id, content_type, image_data)
     VALUES ($1, $2, $3, $4)`,
    [mediaId, exerciseId, contentType, imageData],
  )
  return `/api/exercises/${exerciseId}/media/${mediaId}`
}

export async function createCustomExercise(draft: CustomExerciseDraft): Promise<ExerciseDefinition> {
  await ensureExerciseStorage()
  const id = `custom-${randomUUID()}`
  return transaction(async (client) => {
    await client.query(
      'INSERT INTO custom_exercises (id, definition) VALUES ($1, $2::jsonb)',
      [id, JSON.stringify({ id })],
    )
    const totalImageBytes = { value: 0 }
    const organizationImageUrl = await saveExerciseImage(
      client,
      id,
      draft.organizationImageData,
      totalImageBytes,
    )
    const { overviewImageData, ...scenario } = draft.scenario
    const overviewImageUrl = await saveExerciseImage(
      client,
      id,
      overviewImageData,
      totalImageBytes,
    )
    const injects: ExerciseDefinition['injects'] = []
    for (const inject of draft.injects) {
      const { imageData, ...definition } = inject
      const imageUrl = await saveExerciseImage(client, id, imageData, totalImageBytes)
      injects.push({ ...definition, ...(imageUrl ? { imageUrl } : {}) })
    }
    const definitionFields = { ...draft }
    delete definitionFields.organizationImageData
    const definition: ExerciseDefinition = {
      ...definitionFields,
      id,
      ...(organizationImageUrl ? { organizationImageUrl } : {}),
      scenario: {
        ...scenario,
        ...(overviewImageUrl ? { overviewImageUrl } : {}),
      },
      injects,
    }

    await client.query(
      'UPDATE custom_exercises SET definition = $2::jsonb WHERE id = $1',
      [id, JSON.stringify(definition)],
    )
    return definition
  })
}

export async function updateManagedExercise(
  id: string,
  draft: CustomExerciseDraft,
): Promise<ExerciseDefinition | null> {
  await ensureExerciseStorage()
  if (!isManagedExerciseId(id)) return null

  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('exercise-admin:' || $1))", [id])
    const stored = await client.query<{ definition: ExerciseDefinition; archived: boolean }>(
      'SELECT definition, archived_at IS NOT NULL AS archived FROM custom_exercises WHERE id = $1 FOR UPDATE',
      [id],
    )
    if (stored.rows[0]?.archived) return null
    const existing = stored.rows[0]?.definition ??
      (isBuiltInExerciseId(id) ? getExerciseDefinition(id) : null)
    if (!existing) return null
    if (!stored.rows[0]) {
      await client.query(
        'INSERT INTO custom_exercises (id, definition, archived_at) VALUES ($1, $2::jsonb, NULL)',
        [id, JSON.stringify({ id })],
      )
    }

    const totalImageBytes = { value: 0 }
    const { organizationImageData, scenario: draftScenario, injects: draftInjects, ...fields } = draft
    const organizationImageUrl = await saveExerciseImage(client, id, organizationImageData, totalImageBytes)
    const { overviewImageData, ...scenarioFields } = draftScenario
    const overviewImageUrl = await saveExerciseImage(client, id, overviewImageData, totalImageBytes)
    const previousInjects = new Map(existing.injects.map((inject) => [inject.id, inject]))
    const injects: ExerciseDefinition['injects'] = []

    for (const inject of draftInjects) {
      const { imageData, ...injectFields } = inject
      const imageUrl = await saveExerciseImage(client, id, imageData, totalImageBytes)
      const previousImageUrl = previousInjects.get(inject.id)?.imageUrl
      injects.push({
        ...previousInjects.get(inject.id),
        ...injectFields,
        ...((imageUrl ?? previousImageUrl) ? { imageUrl: imageUrl ?? previousImageUrl } : {}),
      })
    }

    const definition: ExerciseDefinition = {
      ...existing,
      ...fields,
      id,
      ...(organizationImageUrl
        ? { organizationImageUrl }
        : existing.organizationImageUrl
          ? { organizationImageUrl: existing.organizationImageUrl }
          : {}),
      scenario: {
        ...existing.scenario,
        ...scenarioFields,
        ...(overviewImageUrl
          ? { overviewImageUrl }
          : existing.scenario.overviewImageUrl
            ? { overviewImageUrl: existing.scenario.overviewImageUrl }
            : {}),
      },
      injects,
    }
    await client.query(
      `INSERT INTO custom_exercises (id, definition, archived_at)
       VALUES ($1, $2::jsonb, NULL)
       ON CONFLICT (id) DO UPDATE SET definition = EXCLUDED.definition`,
      [id, JSON.stringify(definition)],
    )
    await client.query(
      `UPDATE exercise_instance_states
       SET state = jsonb_set(
         jsonb_set(
           jsonb_set(state, '{settings,title}', to_jsonb($2::text), true),
           '{settings,organization}', to_jsonb($3::text), true
         ),
         '{settings,durationMinutes}', to_jsonb($4::integer), true
       ),
       version = version + 1,
       updated_at = now()
       WHERE instance_id = $1`,
      [id, definition.title, definition.organization, definition.durationMinutes],
    )
    return definition
  })
}

export async function archiveManagedExercise(id: string): Promise<boolean> {
  await ensureExerciseStorage()
  if (!isManagedExerciseId(id)) return false

  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('exercise-admin:' || $1))", [id])
    const stored = await client.query<{ definition: ExerciseDefinition; archived: boolean }>(
      'SELECT definition, archived_at IS NOT NULL AS archived FROM custom_exercises WHERE id = $1 FOR UPDATE',
      [id],
    )
    if (stored.rows[0]?.archived) return true
    const definition = stored.rows[0]?.definition ??
      (isBuiltInExerciseId(id) ? getExerciseDefinition(id) : null)
    if (!definition) return false

    await client.query(
      `INSERT INTO custom_exercises (id, definition, archived_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET archived_at = now()`,
      [id, JSON.stringify(definition)],
    )
    return true
  })
}

export async function getCustomExerciseDefinition(id: string): Promise<ExerciseDefinition | null> {
  await ensureExerciseStorage()
  const result = await getPool().query<{ definition: ExerciseDefinition }>(
    'SELECT definition FROM custom_exercises WHERE id = $1',
    [id],
  )
  return result.rows[0]?.definition ?? null
}

export async function getExerciseDefinitionById(id: string): Promise<ExerciseDefinition | null> {
  const storedDefinition = await getCustomExerciseDefinition(id)
  if (storedDefinition) return storedDefinition
  if (EXERCISE_CHOICES.some((choice) => choice.id === id && choice.available)) {
    return getExerciseDefinition(id)
  }
  return null
}

export async function listExerciseCatalog() {
  await ensureExerciseStorage()
  const result = await getPool().query<{ definition: ExerciseDefinition; archived: boolean }>(
    'SELECT definition, archived_at IS NOT NULL AS archived FROM custom_exercises ORDER BY created_at DESC',
  )
  const customExercises = result.rows
    .filter(({ definition, archived }) => !archived && isCustomExerciseId(definition.id))
    .map(({ definition }) => ({
      id: definition.id,
      organization: definition.organization,
      organizationImageUrl: definition.organizationImageUrl,
      title: definition.title,
      audience: definition.audience,
      durationMinutes: definition.durationMinutes,
      overviewTitle: definition.scenario.title,
    }))
  const builtInOverrides = result.rows
    .filter(({ definition }) => isBuiltInExerciseId(definition.id))
    .map(({ definition }) => definition)
  const deletedExerciseIds = result.rows
    .filter(({ archived }) => archived)
    .map(({ definition }) => definition.id)
  return { customExercises, builtInOverrides, deletedExerciseIds }
}

export async function isExerciseArchived(id: string) {
  await ensureExerciseStorage()
  const result = await getPool().query<{ archived: boolean }>(
    'SELECT archived_at IS NOT NULL AS archived FROM custom_exercises WHERE id = $1',
    [id],
  )
  return result.rows[0]?.archived ?? false
}

export async function getCustomExerciseImage(exerciseId: string, mediaId: string) {
  await ensureExerciseStorage()
  const result = await getPool().query<{ contentType: string; imageData: Buffer }>(
    `SELECT content_type AS "contentType", image_data AS "imageData"
     FROM custom_exercise_media
     WHERE exercise_id = $1 AND id = $2`,
    [exerciseId, mediaId],
  )
  return result.rows[0] ?? null
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

async function createInstanceDefaultState(instanceId: string): Promise<ExerciseState> {
  const state = createDefaultExerciseState()
  const definition = await getExerciseDefinitionById(instanceId)
  if (!definition) throw new Error(`Exercise definition not found: ${instanceId}`)
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

  const initialState = await createInstanceDefaultState(instanceId)
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
  const state = result.rows[0]?.state ?? await createInstanceDefaultState(instanceId)
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
