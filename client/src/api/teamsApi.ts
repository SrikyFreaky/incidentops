import { apiFetch } from './httpClient'

export interface Team {
  id: string
  name: string
  createdAt: string
  role: 'ADMIN' | 'MEMBER'
}

export function listTeams() {
  return apiFetch<{ items: Team[] }>('/api/v1/teams')
}

export function createTeam(name: string) {
  return apiFetch<Team>('/api/v1/teams', { method: 'POST', body: { name } })
}
