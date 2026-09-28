import type { IncidentStatus } from './types'

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ['investigating', 'resolved'],
  investigating: ['resolved', 'open'],
  resolved: [],
}

export function isTransitionAllowed(from: IncidentStatus, to: IncidentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}
