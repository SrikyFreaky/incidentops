import { IncidentForm } from './components/IncidentForm'
import { IncidentList } from './components/IncidentList'
import { useChangeIncidentStatus, useCreateIncident, useIncidentsList, useRemoveIncident } from './hooks/useIncidentsQuery'
import './App.css'

function App() {
  const { data: incidents, status } = useIncidentsList()
  const createIncident = useCreateIncident()
  const changeStatus = useChangeIncidentStatus()
  const removeIncident = useRemoveIncident()

  return (
    <main>
      <h1>IncidentOps</h1>

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
            incidents={incidents}
            onStatusChange={(id, nextStatus) => changeStatus.mutate({ id, status: nextStatus })}
            onRemove={(id) => removeIncident.mutate(id)}
          />
        )}
      </section>
    </main>
  )
}

export default App
