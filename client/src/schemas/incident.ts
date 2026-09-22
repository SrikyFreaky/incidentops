import { z } from 'zod'

export const severitySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const newIncidentSchema = z.object({
  title: z.string().trim().min(3, 'Title needs at least 3 characters').max(120),
  description: z.string().trim().max(2000),
  severity: severitySchema,
})

export type NewIncidentFormValues = z.infer<typeof newIncidentSchema>
