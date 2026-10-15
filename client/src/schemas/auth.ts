import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(8, 'Password needs at least 8 characters'),
  displayName: z.string().trim().min(1, 'Display name is required'),
})
export type SignupFormValues = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>
