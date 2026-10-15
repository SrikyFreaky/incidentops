import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  password: z.string().min(8, 'Password needs at least 8 characters').max(200),
  displayName: z.string().trim().min(1, 'Display name is required').max(120),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required'),
})
