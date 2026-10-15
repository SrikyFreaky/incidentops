import type { Request, Response } from 'express'
import { getValidated } from '../middleware/validate'
import * as teamsService from '../services/teamsService'
import type { createTeamSchema } from '../schemas/team'
import type { Infer } from '../middleware/validate'

export async function create(req: Request, res: Response) {
  const body = getValidated<Infer<typeof createTeamSchema>>(req, 'body')
  const team = await teamsService.createTeam(body.name, req.currentUser!.id)
  res.status(201).json(team)
}

export async function listMine(req: Request, res: Response) {
  const teams = await teamsService.listTeamsForUser(req.currentUser!.id)
  res.status(200).json({ items: teams })
}
