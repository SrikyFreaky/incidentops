import { IncidentForm } from './IncidentForm'
import { IncidentList } from './IncidentList'
import {
  useChangeIncidentStatus,
  useCreateIncident,
  useIncidentsList,
  useRemoveIncident,
} from '../hooks/useIncidentsQuery'

interface IncidentsWorkspaceProps {
  teamId: string
  onSwitchTeam: () => void
}

export function IncidentsWorkspace({ teamId, onSwitchTeam }: IncidentsWorkspaceProps) {
  const { data, status } = useIncidentsList(teamId)
  const createIncident = useCreateIncident(teamId)
  const changeStatus = useChangeIncidentStatus(teamId)
  const removeIncident = useRemoveIncident(teamId)

  return (
    <main>
      <h1>IncidentOps</h1>
      <button type="button" onClick={onSwitchTeam}>
        Switch team
      </button>

      <section>
        <h2>Report an incident</h2>
        <IncidentForm
          onSubmit={(values) => createIncident.mutate(values)}
          isSubmitting={createIncident.isPending}
          submitError={createIncident.isError ? createIncident.error.message : null}
        />
      </section>

      <section>
        <h2>Incidents</h2>
        {status === 'pending' && <p role="status">Loading incidents…</p>}
        {status === 'error' && <p role="alert">Couldn't load incidents. Try refreshing.</p>}
        {status === 'success' && (
          <IncidentList
            incidents={data.items}
            onStatusChange={(id, nextStatus) => changeStatus.mutate({ id, status: nextStatus })}
            onRemove={(id) => removeIncident.mutate(id)}
          />
        )}
      </section>
    </main>
  )
}
