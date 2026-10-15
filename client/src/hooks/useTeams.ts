import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as teamsApi from '../api/teamsApi'

export const teamsQueryKey = ['teams'] as const

export function useTeamsList() {
  return useQuery({
    queryKey: teamsQueryKey,
    queryFn: teamsApi.listTeams,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamsQueryKey }),
  })
}
