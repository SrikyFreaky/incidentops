import { PrismaClient } from '@prisma/client'

// A single shared client per process — Prisma manages its own connection
// pool internally, so there's no benefit to creating more than one.
export const prisma = new PrismaClient()
