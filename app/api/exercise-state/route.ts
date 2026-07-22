import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const DATA_FILE = path.join(process.cwd(), 'data', 'exercise-state.json')
const LOCK_FILE = path.join(process.cwd(), 'data', '.exercise-state.lock')

let writePromise: Promise<void> | null = null

async function acquireLock(): Promise<void> {
  while (true) {
    try {
      fs.accessSync(LOCK_FILE)
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch {
      fs.writeFileSync(LOCK_FILE, String(Date.now()))
      return
    }
  }
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE)
  } catch {
    // ignore
  }
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

function writeStateToDisk(state: Record<string, unknown>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8')
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
    const patch = (await request.json()) as Record<string, unknown>

    if (writePromise) {
      await writePromise
    }

    writePromise = (async () => {
      await acquireLock()
      try {
        const current = readStateFromDisk()
        const merged = deepMerge(current, patch)
        writeStateToDisk(merged)
      } finally {
        releaseLock()
      }
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
      result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>)
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
