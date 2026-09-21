import { IncidentForm } from './components/IncidentForm'
import { IncidentList } from './components/IncidentList'
import { useIncidents } from './useIncidents'
import './App.css'

function App() {
  const { incidents, loadStatus, addIncident, changeStatus, removeIncident } = useIncidents()

  return (
    <main>
      <h1>IncidentOps</h1>

      <section>
        <h2>Report an incident</h2>
        <IncidentForm onSubmit={addIncident} />
      </section>

      <section>
        <h2>Incidents</h2>
        {loadStatus === 'loading' && <p role="status">Loading incidents…</p>}
        {loadStatus === 'error' && <p role="alert">Couldn't load incidents. Try refreshing.</p>}
        {loadStatus === 'ready' && (
          <IncidentList incidents={incidents} onStatusChange={changeStatus} onRemove={removeIncident} />
        )}
      </section>
    </main>
  )
}

export default App
