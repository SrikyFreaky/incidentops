import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors'
import { isTransitionAllowed } from '../incidentRules'
import type { Incident, IncidentStatus, NewIncidentInput } from '../types'

// In-memory store, standing in for Postgres until Day 5. `seq` gives every
// incident a stable, monotonically increasing sort key for cursor
// pagination — createdAt alone isn't safe to page on since two incidents
// created in the same request burst can share a timestamp.
interface StoredIncident extends Incident {
  seq: number
}

let store: StoredIncident[] = []
let nextSeq = 1

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export interface ListIncidentsParams {
  limit?: number
  cursor?: string
}

export interface ListIncidentsResult {
  items: Incident[]
  nextCursor: string | null
}

function encodeCursor(seq: number): string {
  return Buffer.from(String(seq), 'utf8').toString('base64url')
}

function decodeCursor(cursor: string): number {
  const decoded = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
  if (!Number.isInteger(decoded) || decoded < 0) {
    throw ApiError.badRequest('Invalid pagination cursor.')
  }
  return decoded
}

function toIncident({ seq: _seq, ...incident }: StoredIncident): Incident {
  return incident
}

export function listIncidents({ limit, cursor }: ListIncidentsParams): ListIncidentsResult {
  const pageSize = Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const afterSeq = cursor ? decodeCursor(cursor) : Infinity

  const sorted = [...store].sort((a, b) => b.seq - a.seq)
  const page = sorted.filter((incident) => incident.seq < afterSeq).slice(0, pageSize)
  const last = page[page.length - 1]
  const hasMore = last ? sorted.some((incident) => incident.seq < last.seq) : false

  return {
    items: page.map(toIncident),
    nextCursor: hasMore && last ? encodeCursor(last.seq) : null,
  }
}

export function createIncident(input: NewIncidentInput): Incident {
  const incident: StoredIncident = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: 'open',
    createdAt: new Date().toISOString(),
    seq: nextSeq++,
  }
  store.push(incident)
  return toIncident(incident)
}

export function getIncidentOrThrow(id: string): Incident {
  const incident = store.find((item) => item.id === id)
  if (!incident) throw ApiError.notFound(`No incident with id ${id}.`)
  return toIncident(incident)
}

export function changeIncidentStatus(id: string, status: IncidentStatus): Incident {
  const incident = store.find((item) => item.id === id)
  if (!incident) throw ApiError.notFound(`No incident with id ${id}.`)

  if (!isTransitionAllowed(incident.status, status)) {
    throw ApiError.conflict(`Cannot move an incident from ${incident.status} to ${status}.`)
  }

  incident.status = status
  return toIncident(incident)
}

export function removeIncident(id: string): void {
  const index = store.findIndex((item) => item.id === id)
  if (index === -1) throw ApiError.notFound(`No incident with id ${id}.`)
  store.splice(index, 1)
}

// Test-only escape hatch to reset state between test files/cases.
export function __resetStoreForTests(): void {
  store = []
  nextSeq = 1
}
