import type { Incident, IncidentStatus, NewIncidentInput } from './types'

export interface IncidentsState {
  items: Incident[]
}

export type IncidentsAction =
  | { type: 'incident/created'; input: NewIncidentInput }
  | { type: 'incident/status-changed'; id: string; status: IncidentStatus }
  | { type: 'incident/removed'; id: string }

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ['investigating', 'resolved'],
  investigating: ['resolved', 'open'],
  resolved: [],
}

export function isTransitionAllowed(from: IncidentStatus, to: IncidentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}

export const initialIncidentsState: IncidentsState = { items: [] }

export function incidentsReducer(state: IncidentsState, action: IncidentsAction): IncidentsState {
  switch (action.type) {
    case 'incident/created': {
      const incident: Incident = {
        id: crypto.randomUUID(),
        title: action.input.title,
        description: action.input.description,
        severity: action.input.severity,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      return { items: [incident, ...state.items] }
    }

    case 'incident/status-changed': {
      return {
        items: state.items.map((incident) => {
          if (incident.id !== action.id) return incident
          if (!isTransitionAllowed(incident.status, action.status)) return incident
          return { ...incident, status: action.status }
        }),
      }
    }

    case 'incident/removed': {
      return { items: state.items.filter((incident) => incident.id !== action.id) }
    }

    default:
      return state
  }
}
