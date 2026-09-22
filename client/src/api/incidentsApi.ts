import { isTransitionAllowed } from '../incidentRules'
import type { Incident, IncidentStatus, NewIncidentInput } from '../types'

// Stand-in for the real Node API (arrives Day 4). Keeps an in-memory store
// and fake network latency so TanStack Query has something real to cache,
// invalidate, and roll back against.
const NETWORK_DELAY_MS = 350

let store: Incident[] = []

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS))
}

export async function fetchIncidents(): Promise<Incident[]> {
  return delay([...store])
}

export async function createIncident(input: NewIncidentInput): Promise<Incident> {
  // Deterministic failure hook for exercising rollback: typing "fail" into
  // the title simulates a rejected request instead of relying on random
  // flakiness, which would make the rollback path hard to demo on demand.
  if (input.title.toLowerCase().includes('fail')) {
    await delay(null)
    throw new Error('The server rejected this incident. Try again.')
  }

  const incident: Incident = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  store = [incident, ...store]
  return delay(incident)
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const existing = store.find((incident) => incident.id === id)
  if (!existing) throw new Error('Incident not found.')
  if (!isTransitionAllowed(existing.status, status)) {
    throw new Error(`Cannot move an incident from ${existing.status} to ${status}.`)
  }

  const updated: Incident = { ...existing, status }
  store = store.map((incident) => (incident.id === id ? updated : incident))
  return delay(updated)
}

export async function removeIncident(id: string): Promise<void> {
  store = store.filter((incident) => incident.id !== id)
  return delay(undefined)
}
