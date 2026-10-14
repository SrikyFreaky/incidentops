import type { Request, Response } from 'express'
import { getValidated } from '../middleware/validate'
import * as incidentsService from '../services/incidentsService'
import type {
  changeStatusSchema,
  incidentIdParamsSchema,
  listIncidentsQuerySchema,
  newIncidentSchema,
} from '../schemas/incident'
import type { Infer } from '../middleware/validate'

export async function list(req: Request, res: Response) {
  const query = getValidated<Infer<typeof listIncidentsQuerySchema>>(req, 'query')
  const result = await incidentsService.listIncidents(query)
  res.status(200).json(result)
}

export async function create(req: Request, res: Response) {
  const body = getValidated<Infer<typeof newIncidentSchema>>(req, 'body')
  const incident = await incidentsService.createIncident(body)
  res.status(201).json(incident)
}

export async function getById(req: Request, res: Response) {
  const params = getValidated<Infer<typeof incidentIdParamsSchema>>(req, 'params')
  const incident = await incidentsService.getIncidentOrThrow(params.id)
  res.status(200).json(incident)
}

export async function changeStatus(req: Request, res: Response) {
  const params = getValidated<Infer<typeof incidentIdParamsSchema>>(req, 'params')
  const body = getValidated<Infer<typeof changeStatusSchema>>(req, 'body')
  const incident = await incidentsService.changeIncidentStatus(params.id, body.status)
  res.status(200).json(incident)
}

export async function remove(req: Request, res: Response) {
  const params = getValidated<Infer<typeof incidentIdParamsSchema>>(req, 'params')
  await incidentsService.removeIncident(params.id)
  res.status(204).send()
}
