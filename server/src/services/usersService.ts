import { prisma } from '../db'
import { ApiError } from '../errors'
import { hashPassword, verifyPassword } from '../auth/password'

export interface PublicUser {
  id: string
  email: string
  displayName: string
}

function toPublicUser(user: { id: string; email: string; displayName: string }): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName }
}

export async function createUser(email: string, password: string, displayName: string): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw ApiError.conflict('An account with this email already exists.')

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { email, passwordHash, displayName } })
  return toPublicUser(user)
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email } })
  // Same error for "no such user" and "wrong password" — confirming which
  // one failed would let an attacker enumerate which emails have accounts.
  if (!user) throw ApiError.unauthorized('Invalid email or password.')

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw ApiError.unauthorized('Invalid email or password.')

  return toPublicUser(user)
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw ApiError.notFound(`No user with id ${id}.`)
  return toPublicUser(user)
}
