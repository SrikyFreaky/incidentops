import type { Incident as DbIncident, IncidentStatus as DbStatus, Severity as DbSeverity } from '@prisma/client'
import { prisma } from '../db'
import { ApiError } from '../errors'
import { isTransitionAllowed } from '../incidentRules'
import type { Incident, IncidentStatus, NewIncidentInput, Severity } from '../types'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export interface ListIncidentsParams {
  limit?: number
  cursor?: string
}

export interface ListIncidentsResult {
  items: Incident[]
  nextCursor: string | null
}

function toApiSeverity(severity: DbSeverity): Severity {
  return severity.toLowerCase() as Severity
}

function toDbSeverity(severity: Severity): DbSeverity {
  return severity.toUpperCase() as DbSeverity
}

function toApiStatus(status: DbStatus): IncidentStatus {
  return status.toLowerCase() as IncidentStatus
}

function toDbStatus(status: IncidentStatus): DbStatus {
  return status.toUpperCase() as DbStatus
}

function toIncident(row: DbIncident): Incident {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: toApiSeverity(row.severity),
    status: toApiStatus(row.status),
    createdAt: row.createdAt.toISOString(),
  }
}

function encodeCursor(seq: bigint): string {
  return Buffer.from(seq.toString(), 'utf8').toString('base64url')
}

function decodeCursor(cursor: string): bigint {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    return BigInt(decoded)
  } catch {
    throw ApiError.badRequest('Invalid pagination cursor.')
  }
}

export async function listIncidents(
  teamId: string,
  { limit, cursor }: ListIncidentsParams,
): Promise<ListIncidentsResult> {
  const pageSize = Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const afterSeq = cursor ? decodeCursor(cursor) : null

  const rows = await prisma.incident.findMany({
    where: { teamId, ...(afterSeq !== null ? { seq: { lt: afterSeq } } : {}) },
    orderBy: { seq: 'desc' },
    take: pageSize + 1,
  })

  const hasMore = rows.length > pageSize
  const page = rows.slice(0, pageSize)
  const last = page[page.length - 1]

  return {
    items: page.map(toIncident),
    nextCursor: hasMore && last ? encodeCursor(last.seq) : null,
  }
}

export async function createIncident(
  teamId: string,
  createdById: string,
  input: NewIncidentInput,
): Promise<Incident> {
  // First real transaction: the incident row and its initial "created"
  // timeline event either both land or neither does. Without this, a
  // crash between the two inserts would leave an incident with no audit
  // trail of how it came to exist.
  const incident = await prisma.$transaction(async (tx) => {
    const created = await tx.incident.create({
      data: {
        teamId,
        createdById,
        title: input.title,
        description: input.description,
        severity: toDbSeverity(input.severity),
      },
    })

    await tx.incidentEvent.create({
      data: {
        incidentId: created.id,
        type: 'CREATED',
        message: `Incident reported: ${created.title}`,
        actorId: createdById,
      },
    })

    return created
  })

  return toIncident(incident)
}

// Every lookup is scoped by teamId, not just id — this is what stops a
// signed-in member of Team A from reading or modifying Team B's incident
// by guessing/reusing a UUID. Membership in *some* team is not the same
// as membership in *this* incident's team.
export async function getIncidentOrThrow(teamId: string, id: string): Promise<Incident> {
  const incident = await prisma.incident.findFirst({ where: { id, teamId } })
  if (!incident) throw ApiError.notFound(`No incident with id ${id}.`)
  return toIncident(incident)
}

export async function changeIncidentStatus(
  teamId: string,
  id: string,
  status: IncidentStatus,
  actorId: string,
): Promise<Incident> {
  const existing = await prisma.incident.findFirst({ where: { id, teamId } })
  if (!existing) throw ApiError.notFound(`No incident with id ${id}.`)

  const currentStatus = toApiStatus(existing.status)
  if (!isTransitionAllowed(currentStatus, status)) {
    throw ApiError.conflict(`Cannot move an incident from ${currentStatus} to ${status}.`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const incident = await tx.incident.update({
      where: { id },
      data: {
        status: toDbStatus(status),
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
    })

    await tx.incidentEvent.create({
      data: {
        incidentId: id,
        type: 'STATUS_CHANGED',
        message: `Status changed from ${currentStatus} to ${status}`,
        actorId,
      },
    })

    return incident
  })

  return toIncident(updated)
}

export async function removeIncident(teamId: string, id: string): Promise<void> {
  const result = await prisma.incident.deleteMany({ where: { id, teamId } })
  if (result.count === 0) throw ApiError.notFound(`No incident with id ${id}.`)
}
