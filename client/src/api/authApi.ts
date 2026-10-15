import { apiFetch } from './httpClient'

export interface CurrentUser {
  id: string
  email: string
  displayName: string
}

export interface SignupInput {
  email: string
  password: string
  displayName: string
}

export interface LoginInput {
  email: string
  password: string
}

export function signup(input: SignupInput) {
  return apiFetch<CurrentUser>('/api/v1/auth/signup', { method: 'POST', body: input })
}

export function login(input: LoginInput) {
  return apiFetch<CurrentUser>('/api/v1/auth/login', { method: 'POST', body: input })
}

export function logout() {
  return apiFetch<void>('/api/v1/auth/logout', { method: 'POST' })
}

export function fetchCurrentUser() {
  return apiFetch<CurrentUser>('/api/v1/auth/me')
}
