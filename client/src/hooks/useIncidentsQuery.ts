import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createIncident,
  fetchIncidents,
  removeIncident,
  updateIncidentStatus,
  type ListIncidentsResult,
} from '../api/incidentsApi'
import type { Incident, IncidentStatus, NewIncidentInput } from '../types'

function incidentsQueryKey(teamId: string) {
  return ['incidents', teamId] as const
}

export function useIncidentsList(teamId: string) {
  return useQuery({
    queryKey: incidentsQueryKey(teamId),
    queryFn: () => fetchIncidents(teamId),
  })
}

export function useCreateIncident(teamId: string) {
  const queryClient = useQueryClient()
  const queryKey = incidentsQueryKey(teamId)

  return useMutation({
    mutationFn: (input: NewIncidentInput) => createIncident(teamId, input),
    onMutate: async (input: NewIncidentInput) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ListIncidentsResult>(queryKey)

      const optimisticIncident: Incident = {
        id: `optimistic-${crypto.randomUUID()}`,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<ListIncidentsResult>(queryKey, (current) => ({
        items: [optimisticIncident, ...(current?.items ?? [])],
        nextCursor: current?.nextCursor ?? null,
      }))

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useChangeIncidentStatus(teamId: string) {
  const queryClient = useQueryClient()
  const queryKey = incidentsQueryKey(teamId)

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      updateIncidentStatus(teamId, id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ListIncidentsResult>(queryKey)

      queryClient.setQueryData<ListIncidentsResult>(queryKey, (current) => ({
        items: (current?.items ?? []).map((incident) =>
          incident.id === id ? { ...incident, status } : incident,
        ),
        nextCursor: current?.nextCursor ?? null,
      }))

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useRemoveIncident(teamId: string) {
  const queryClient = useQueryClient()
  const queryKey = incidentsQueryKey(teamId)

  return useMutation({
    mutationFn: (id: string) => removeIncident(teamId, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ListIncidentsResult>(queryKey)

      queryClient.setQueryData<ListIncidentsResult>(queryKey, (current) => ({
        items: (current?.items ?? []).filter((incident) => incident.id !== id),
        nextCursor: current?.nextCursor ?? null,
      }))

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
