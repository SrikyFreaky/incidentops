import { apiFetch } from './httpClient'
import type { Incident, IncidentStatus, NewIncidentInput } from '../types'

export interface ListIncidentsResult {
  items: Incident[]
  nextCursor: string | null
}

export function fetchIncidents(teamId: string): Promise<ListIncidentsResult> {
  return apiFetch<ListIncidentsResult>(`/api/v1/teams/${teamId}/incidents`)
}

export function createIncident(teamId: string, input: NewIncidentInput): Promise<Incident> {
  return apiFetch<Incident>(`/api/v1/teams/${teamId}/incidents`, { method: 'POST', body: input })
}

export function updateIncidentStatus(
  teamId: string,
  id: string,
  status: IncidentStatus,
): Promise<Incident> {
  return apiFetch<Incident>(`/api/v1/teams/${teamId}/incidents/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export function removeIncident(teamId: string, id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/teams/${teamId}/incidents/${id}`, { method: 'DELETE' })
}
