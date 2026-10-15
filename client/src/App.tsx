import { useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { IncidentsWorkspace } from './components/IncidentsWorkspace'
import { TeamPicker } from './components/TeamPicker'
import { useCurrentUser, useLogout } from './hooks/useAuth'
import './App.css'

const SELECTED_TEAM_STORAGE_KEY = 'incidentops.selectedTeamId'

function App() {
  const { data: currentUser, status } = useCurrentUser()
  const logout = useLogout()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() =>
    localStorage.getItem(SELECTED_TEAM_STORAGE_KEY),
  )

  function selectTeam(teamId: string) {
    localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, teamId)
    setSelectedTeamId(teamId)
  }

  function switchTeam() {
    localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY)
    setSelectedTeamId(null)
  }

  if (status === 'pending') {
    return <p role="status">Loading…</p>
  }

  if (!currentUser) {
    return (
      <main>
        <AuthForm />
      </main>
    )
  }

  return (
    <div>
      <header>
        <span>Signed in as {currentUser.displayName}</span>
        <button type="button" onClick={() => logout.mutate()}>
          Log out
        </button>
      </header>

      {selectedTeamId ? (
        <IncidentsWorkspace teamId={selectedTeamId} onSwitchTeam={switchTeam} />
      ) : (
        <main>
          <TeamPicker onSelect={selectTeam} />
        </main>
      )}
    </div>
  )
}

export default App
