import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, 'Team name needs at least 2 characters'),
})
export type CreateTeamFormValues = z.infer<typeof createTeamSchema>
