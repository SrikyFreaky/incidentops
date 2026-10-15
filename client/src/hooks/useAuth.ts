import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/authApi'

export const currentUserQueryKey = ['currentUser'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.fetchCurrentUser,
    retry: false,
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => queryClient.setQueryData(currentUserQueryKey, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null)
      queryClient.clear()
    },
  })
}
