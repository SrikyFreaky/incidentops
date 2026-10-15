import { prisma } from '../db'

export interface Team {
  id: string
  name: string
  createdAt: string
  role: 'ADMIN' | 'MEMBER'
}

export async function createTeam(name: string, creatorUserId: string): Promise<Team> {
  // Creating the team and making its creator an admin member are one
  // unit of work — a team that exists with no members (or vice versa)
  // isn't a valid state to ever observe, even transiently.
  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.team.create({ data: { name } })
    await tx.teamMembership.create({
      data: { teamId: created.id, userId: creatorUserId, role: 'ADMIN' },
    })
    return created
  })

  return { id: team.id, name: team.name, createdAt: team.createdAt.toISOString(), role: 'ADMIN' }
}

export async function listTeamsForUser(userId: string): Promise<Team[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    createdAt: m.team.createdAt.toISOString(),
    role: m.role,
  }))
}
