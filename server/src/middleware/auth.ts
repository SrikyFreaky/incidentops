import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../db'
import { ApiError } from '../errors'

export interface CurrentUser {
  id: string
  email: string
  displayName: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: CurrentUser
      membership?: { role: 'ADMIN' | 'MEMBER' }
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const userId = req.session.userId
  if (!userId) {
    next(ApiError.unauthorized('You must be signed in to do that.'))
    return
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    // The session outlived the user it points at (e.g. deleted account).
    req.session.userId = undefined
    next(ApiError.unauthorized('You must be signed in to do that.'))
    return
  }

  req.currentUser = { id: user.id, email: user.email, displayName: user.displayName }
  next()
}

// Reads the team id from whichever route param name is used — incident
// routes nest under `/teams/:teamId/...`, so this defaults to that, but
// stays reusable for any future route with a differently-named param.
export function requireTeamMembership(paramName = 'teamId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const teamId = req.params[paramName] as string | undefined
    const userId = req.currentUser?.id

    if (!userId) {
      next(ApiError.unauthorized('You must be signed in to do that.'))
      return
    }

    if (!teamId) {
      next(ApiError.badRequest(`Missing route parameter: ${paramName}.`))
      return
    }

    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!membership) {
      next(ApiError.forbidden('You are not a member of this team.'))
      return
    }

    req.membership = { role: membership.role }
    next()
  }
}
