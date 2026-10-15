import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo password 123'

async function main() {
  // Upserts so this is safe to run repeatedly (e.g. after `prisma migrate
  // reset`) without creating duplicate demo rows each time.
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, displayName: 'Demo User' },
  })

  let team = await prisma.team.findFirst({ where: { name: 'Demo Team' } })
  if (!team) {
    team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({ data: { name: 'Demo Team' } })
      await tx.teamMembership.create({
        data: { teamId: created.id, userId: user.id, role: 'ADMIN' },
      })
      return created
    })
  }

  const existingIncidents = await prisma.incident.count({ where: { teamId: team.id } })
  if (existingIncidents === 0) {
    await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          teamId: team.id,
          createdById: user.id,
          title: 'Checkout API returning 500s',
          description: 'Spiking error rate on the EU checkout endpoint since ~09:40 UTC.',
          severity: 'HIGH',
        },
      })
      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: 'CREATED',
          message: `Incident reported: ${incident.title}`,
          actorId: user.id,
        },
      })
    })
  }

  console.log('Seed complete.')
  console.log(`  Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  console.log(`  Team: ${team.name} (${team.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
