import { readFile } from 'node:fs/promises'
import pg from 'pg'

const filePath = process.argv[2]
if (!filePath) {
  throw new Error('Usage: node scripts/import-exercise-state.mjs <path-to-exercise-state.json>')
}

if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGDATABASE) {
  throw new Error('PGHOST, PGUSER, and PGDATABASE must be configured')
}

const state = JSON.parse(await readFile(filePath, 'utf8'))
if (typeof state !== 'object' || state === null || Array.isArray(state)) {
  throw new Error('Exercise state file must contain a JSON object')
}

const pool = new pg.Pool()
const client = await pool.connect()

try {
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock($1)', [741920681])
  const existing = await client.query('SELECT 1 FROM exercise_state WHERE id = 1')
  if (existing.rowCount) {
    throw new Error('Exercise state already exists in PostgreSQL; refusing to overwrite it')
  }
  await client.query('INSERT INTO exercise_state (id, state) VALUES (1, $1::jsonb)', [
    JSON.stringify(state),
  ])
  await client.query('COMMIT')
  console.log('Imported exercise state into PostgreSQL.')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
