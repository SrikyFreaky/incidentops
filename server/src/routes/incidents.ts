import { Router } from 'express'
import * as incidentsController from '../controllers/incidentsController'
import { requireAuth, requireTeamMembership } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  changeStatusSchema,
  incidentIdParamsSchema,
  listIncidentsQuerySchema,
  newIncidentSchema,
  teamIncidentsParamsSchema,
} from '../schemas/incident'

// Mounted at /api/v1/teams/:teamId/incidents — mergeParams lets this
// router see the parent router's :teamId.
export const incidentsRouter = Router({ mergeParams: true })

incidentsRouter.use(requireAuth, requireTeamMembership())

incidentsRouter.get(
  '/',
  validate('params', teamIncidentsParamsSchema),
  validate('query', listIncidentsQuerySchema),
  incidentsController.list,
)

incidentsRouter.post(
  '/',
  validate('params', teamIncidentsParamsSchema),
  validate('body', newIncidentSchema),
  incidentsController.create,
)

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
