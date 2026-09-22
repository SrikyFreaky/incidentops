import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIncident, fetchIncidents, removeIncident, updateIncidentStatus } from '../api/incidentsApi'
import type { Incident, IncidentStatus, NewIncidentInput } from '../types'

export const incidentsQueryKey = ['incidents'] as const

export function useIncidentsList() {
  return useQuery({
    queryKey: incidentsQueryKey,
    queryFn: fetchIncidents,
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createIncident,
    onMutate: async (input: NewIncidentInput) => {
      await queryClient.cancelQueries({ queryKey: incidentsQueryKey })
      const previous = queryClient.getQueryData<Incident[]>(incidentsQueryKey)

      const optimisticIncident: Incident = {
        id: `optimistic-${crypto.randomUUID()}`,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<Incident[]>(incidentsQueryKey, (current) => [
        optimisticIncident,
        ...(current ?? []),
      ])

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(incidentsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsQueryKey })
    },
  })
}

export function useChangeIncidentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      updateIncidentStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: incidentsQueryKey })
      const previous = queryClient.getQueryData<Incident[]>(incidentsQueryKey)

      queryClient.setQueryData<Incident[]>(incidentsQueryKey, (current) =>
        (current ?? []).map((incident) => (incident.id === id ? { ...incident, status } : incident)),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(incidentsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsQueryKey })
    },
  })
}

export function useRemoveIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeIncident,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: incidentsQueryKey })
      const previous = queryClient.getQueryData<Incident[]>(incidentsQueryKey)

      queryClient.setQueryData<Incident[]>(incidentsQueryKey, (current) =>
        (current ?? []).filter((incident) => incident.id !== id),
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(incidentsQueryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incidentsQueryKey })
    },
  })
}
