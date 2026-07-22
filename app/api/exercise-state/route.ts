import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const DATA_FILE = path.join(process.cwd(), 'data', 'exercise-state.json')
const API_SECRET = process.env.EXERCISE_API_SECRET || ''

let writePromise: Promise<void> | null = null

function checkAuth(request: Request) {
  if (!API_SECRET) return true
  const secret = request.headers.get('x-api-secret')
  return secret === API_SECRET
}

function readStateFromDisk(): Record<string, unknown> {
  try {
    if (!fs.existsSync(DATA_FILE)) return {}
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writeStateToDiskAtomic(state: Record<string, unknown>) {
  const tmpFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8')
  fs.renameSync(tmpFile, DATA_FILE)
}

export async function GET() {
  try {
    const state = readStateFromDisk()
    return NextResponse.json(state)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patch = (await request.json()) as Record<string, unknown>

    if (writePromise) {
      await writePromise
    }

    writePromise = (async () => {
      const current = readStateFromDisk()
      const merged = deepMerge(current, patch)
      writeStateToDiskAtomic(merged)
    })()

    await writePromise

    const state = readStateFromDisk()
    return NextResponse.json(state)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue
    }
  }

  return result
}

function isPlainObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
