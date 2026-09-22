import type { Incident, IncidentStatus } from '../types'
import { isTransitionAllowed } from '../incidentRules'

const NEXT_STATUSES: IncidentStatus[] = ['open', 'investigating', 'resolved']

interface IncidentListProps {
  incidents: Incident[]
  onStatusChange: (id: string, status: IncidentStatus) => void
  onRemove: (id: string) => void
}

export function IncidentList({ incidents, onStatusChange, onRemove }: IncidentListProps) {
  if (incidents.length === 0) {
    return <p role="status">No incidents reported. Things are quiet.</p>
  }

  return (
    <ul aria-label="Incidents">
      {incidents.map((incident) => (
        <li key={incident.id}>
          <div>
            <strong>{incident.title}</strong> — {incident.severity} — {incident.status}
          </div>
          {incident.description && <p>{incident.description}</p>}
          <div>
            {NEXT_STATUSES.filter((status) => status !== incident.status).map((status) => {
              const allowed = isTransitionAllowed(incident.status, status)
              return (
                <button
                  key={status}
                  type="button"
                  disabled={!allowed}
                  onClick={() => onStatusChange(incident.id, status)}
                >
                  Mark {status}
                </button>
              )
            })}
            <button type="button" onClick={() => onRemove(incident.id)}>
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
