import type { Request, Response } from 'express'
import { getValidated } from '../middleware/validate'
import * as usersService from '../services/usersService'
import { ApiError } from '../errors'
import type { loginSchema, signupSchema } from '../schemas/auth'
import type { Infer } from '../middleware/validate'

export async function signup(req: Request, res: Response) {
  const body = getValidated<Infer<typeof signupSchema>>(req, 'body')
  const user = await usersService.createUser(body.email, body.password, body.displayName)
  req.session.userId = user.id
  res.status(201).json(user)
}

export async function login(req: Request, res: Response) {
  const body = getValidated<Infer<typeof loginSchema>>(req, 'body')
  const user = await usersService.verifyCredentials(body.email, body.password)
  req.session.userId = user.id
  res.status(200).json(user)
}

export function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Could not log out.' } })
      return
    }
    res.status(204).send()
  })
}

export async function me(req: Request, res: Response) {
  if (!req.currentUser) throw ApiError.unauthorized('You must be signed in to do that.')
  res.status(200).json(req.currentUser)
}
