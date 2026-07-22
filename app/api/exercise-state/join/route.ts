import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

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

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const participant = (await request.json()) as Record<string, unknown>

    if (writePromise) {
      await writePromise
    }

    writePromise = (async () => {
      const current = readStateFromDisk()
      const participants = Array.isArray(current.participants) ? current.participants : []
      
      const newParticipant = {
        id: crypto.randomUUID(),
        deviceId: participant.deviceId,
        name: participant.name,
        roleId: participant.roleId,
      }
      
      const exists = participants.some(
        (p: Record<string, unknown>) => p.deviceId === participant.deviceId
      )
      
      if (!exists) {
        participants.push(newParticipant)
      }
      
      writeStateToDiskAtomic({
        ...current,
        participants,
      })
    })()

    await writePromise

    const state = readStateFromDisk()
    return NextResponse.json({ 
      success: true, 
      participant: newParticipant,
      totalParticipants: (state.participants as Record<string, unknown>[]).length 
    })
  } catch {
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 })
  }
}
