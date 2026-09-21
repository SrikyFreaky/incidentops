export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentStatus = 'open' | 'investigating' | 'resolved'

export interface Incident {
  id: string
  title: string
  description: string
  severity: Severity
  status: IncidentStatus
  createdAt: string
}

export type NewIncidentInput = Pick<Incident, 'title' | 'description' | 'severity'>
