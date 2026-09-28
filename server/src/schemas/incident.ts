import { z } from 'zod'

export const severitySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const statusSchema = z.enum(['open', 'investigating', 'resolved'])

export const newIncidentSchema = z.object({
  title: z.string().trim().min(3, 'Title needs at least 3 characters').max(120),
  description: z.string().trim().max(2000),
  severity: severitySchema,
})

export const changeStatusSchema = z.object({
  status: statusSchema,
})

export const listIncidentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
})

export const incidentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid incident id.'),
})
