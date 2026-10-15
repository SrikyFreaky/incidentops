import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, 'Team name needs at least 2 characters').max(120),
})

export const teamIdParamsSchema = z.object({
  teamId: z.string().uuid('Invalid team id.'),
})
