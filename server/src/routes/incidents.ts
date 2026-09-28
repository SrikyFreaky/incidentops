import { Router } from 'express'
import * as incidentsController from '../controllers/incidentsController'
import { validate } from '../middleware/validate'
import {
  changeStatusSchema,
  incidentIdParamsSchema,
  listIncidentsQuerySchema,
  newIncidentSchema,
} from '../schemas/incident'

export const incidentsRouter = Router()

incidentsRouter.get('/', validate('query', listIncidentsQuerySchema), incidentsController.list)

incidentsRouter.post('/', validate('body', newIncidentSchema), incidentsController.create)

incidentsRouter.get(
  '/:id',
  validate('params', incidentIdParamsSchema),
  incidentsController.getById,
)

incidentsRouter.patch(
  '/:id/status',
  validate('params', incidentIdParamsSchema),
  validate('body', changeStatusSchema),
  incidentsController.changeStatus,
)

incidentsRouter.delete(
  '/:id',
  validate('params', incidentIdParamsSchema),
  incidentsController.remove,
)
