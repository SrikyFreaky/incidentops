import { Router } from 'express'
import * as teamsController from '../controllers/teamsController'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createTeamSchema } from '../schemas/team'

export const teamsRouter = Router()

teamsRouter.use(requireAuth)

teamsRouter.post('/', validate('body', createTeamSchema), teamsController.create)
teamsRouter.get('/', teamsController.listMine)
