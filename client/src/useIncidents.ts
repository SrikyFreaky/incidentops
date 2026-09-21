import { useCallback, useEffect, useReducer, useState } from 'react'
import { incidentsReducer, initialIncidentsState } from './incidentsReducer'
import type { IncidentStatus, NewIncidentInput } from './types'

type LoadStatus = 'loading' | 'ready' | 'error'

const SEED_DELAY_MS = 400

export function useIncidents() {
  const [state, dispatch] = useReducer(incidentsReducer, initialIncidentsState)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')

  useEffect(() => {
    const timer = setTimeout(() => setLoadStatus('ready'), SEED_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const addIncident = useCallback((input: NewIncidentInput) => {
    dispatch({ type: 'incident/created', input })
  }, [])

  const changeStatus = useCallback((id: string, status: IncidentStatus) => {
    dispatch({ type: 'incident/status-changed', id, status })
  }, [])

  const removeIncident = useCallback((id: string) => {
    dispatch({ type: 'incident/removed', id })
  }, [])

  return {
    incidents: state.items,
    loadStatus,
    addIncident,
    changeStatus,
    removeIncident,
  }
}
