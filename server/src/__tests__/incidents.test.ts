import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { prisma } from '../db'

const app = createApp()

async function resetDb() {
  // Deletion order matters: incidents cascade-delete their events, but a
  // user can't be deleted while they still "created by" an incident
  // (onDelete: Restrict) — so incidents go first, then memberships/teams,
  // then users.
  await prisma.incident.deleteMany()
  await prisma.teamMembership.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
}

beforeEach(resetDb)

afterAll(async () => {
  await resetDb()
  await prisma.$disconnect()
})

let userCounter = 0
async function signUpAndLogIn(agent: ReturnType<typeof request.agent>) {
  userCounter += 1
  const email = `user${userCounter}@example.com`
  await agent.post('/api/v1/auth/signup').send({
    email,
    password: 'correct horse battery staple',
    displayName: `Test User ${userCounter}`,
  })
  return email
}

async function createTeamAs(agent: ReturnType<typeof request.agent>, name = 'Platform Team') {
  const res = await agent.post('/api/v1/teams').send({ name })
  return res.body.id as string
}

describe('auth', () => {
  it('signs up a new user and starts a session', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/v1/auth/signup').send({
      email: 'new@example.com',
      password: 'correct horse battery staple',
      displayName: 'New Person',
    })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ email: 'new@example.com', displayName: 'New Person' })
    expect(res.body.passwordHash).toBeUndefined()

    const me = await agent.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.email).toBe('new@example.com')
  })

  it('rejects a duplicate signup email with 409', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/signup').send({
      email: 'dupe@example.com',
      password: 'correct horse battery staple',
      displayName: 'First',
    })

    const res = await request(app).post('/api/v1/auth/signup').send({
      email: 'dupe@example.com',
      password: 'another password',
      displayName: 'Second',
    })

    expect(res.status).toBe(409)
  })

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/v1/auth/signup').send({
      email: 'login@example.com',
      password: 'correct horse battery staple',
      displayName: 'Login Test',
    })

    const agent = request.agent(app)
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'correct horse battery staple' })

    expect(res.status).toBe(200)
    const me = await agent.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
  })

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/v1/auth/signup').send({
      email: 'wrongpw@example.com',
      password: 'correct horse battery staple',
      displayName: 'Test',
    })

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'not the right password' })

    expect(res.status).toBe(401)
  })

  it('rejects /me with no session', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('clears the session on logout', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)

    const logout = await agent.post('/api/v1/auth/logout')
    expect(logout.status).toBe(204)

    const me = await agent.get('/api/v1/auth/me')
    expect(me.status).toBe(401)
  })
})

describe('teams', () => {
  it('creates a team and makes the creator an admin member', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)

    const res = await agent.post('/api/v1/teams').send({ name: 'Platform Team' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Platform Team', role: 'ADMIN' })

    const list = await agent.get('/api/v1/teams')
    expect(list.body.items).toHaveLength(1)
  })
})

describe('incidents (team-scoped)', () => {
  it('rejects incident creation with no session', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const res = await request(app)
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'Checkout API down', description: '', severity: 'high' })

    expect(res.status).toBe(401)
  })

  it('rejects incident creation from a signed-in non-member with 403', async () => {
    const owner = request.agent(app)
    await signUpAndLogIn(owner)
    const teamId = await createTeamAs(owner)

    const outsider = request.agent(app)
    await signUpAndLogIn(outsider)

    const res = await outsider
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'Checkout API down', description: '', severity: 'high' })

    expect(res.status).toBe(403)
  })

  it('allows a team member to create and fetch an incident', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const created = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'Checkout API down', description: 'EU only', severity: 'high' })

    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ title: 'Checkout API down', status: 'open' })

    const fetched = await agent.get(`/api/v1/teams/${teamId}/incidents/${created.body.id}`)
    expect(fetched.status).toBe(200)
  })

  it('rejects a malformed JSON body with 400, not 500', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const res = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .set('Content-Type', 'application/json')
      .send('{"title": "missing closing brace"')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects an invalid title with 400', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const res = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'ab', description: '', severity: 'high' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('returns 404 for a missing incident', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const res = await agent.get(
      `/api/v1/teams/${teamId}/incidents/00000000-0000-0000-0000-000000000000`,
    )

    expect(res.status).toBe(404)
  })

  it('returns 404 for an incident that belongs to a different team, even for a valid member elsewhere', async () => {
    const owner = request.agent(app)
    await signUpAndLogIn(owner)
    const ownerTeamId = await createTeamAs(owner, 'Owner Team')
    const created = await owner
      .post(`/api/v1/teams/${ownerTeamId}/incidents`)
      .send({ title: 'Owner-only incident', description: '', severity: 'low' })

    const other = request.agent(app)
    await signUpAndLogIn(other)
    const otherTeamId = await createTeamAs(other, 'Other Team')

    // `other` is a real member of `otherTeamId`, just not of `ownerTeamId` —
    // proves membership is checked per-team, not just "signed in + a member
    // of *some* team."
    const res = await other.get(`/api/v1/teams/${otherTeamId}/incidents/${created.body.id}`)
    expect(res.status).toBe(404)
  })

  it('rejects an illegal transition with 409', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const created = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'Payments failing', description: '', severity: 'critical' })

    await agent
      .patch(`/api/v1/teams/${teamId}/incidents/${created.body.id}/status`)
      .send({ status: 'resolved' })

    const res = await agent
      .patch(`/api/v1/teams/${teamId}/incidents/${created.body.id}/status`)
      .send({ status: 'investigating' })

    expect(res.status).toBe(409)
  })

  it('allows a legal transition', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const created = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'DB latency spike', description: '', severity: 'medium' })

    const res = await agent
      .patch(`/api/v1/teams/${teamId}/incidents/${created.body.id}/status`)
      .send({ status: 'investigating' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('investigating')
  })

  it('paginates with a cursor', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    for (const title of ['Incident A', 'Incident B', 'Incident C']) {
      await agent
        .post(`/api/v1/teams/${teamId}/incidents`)
        .send({ title, description: '', severity: 'low' })
    }

    const firstPage = await agent.get(`/api/v1/teams/${teamId}/incidents?limit=2`)
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.nextCursor).not.toBeNull()

    const secondPage = await agent.get(
      `/api/v1/teams/${teamId}/incidents?limit=2&cursor=${firstPage.body.nextCursor}`,
    )
    expect(secondPage.status).toBe(200)
    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.nextCursor).toBeNull()
  })

  it('removes an incident and 404s afterward', async () => {
    const agent = request.agent(app)
    await signUpAndLogIn(agent)
    const teamId = await createTeamAs(agent)

    const created = await agent
      .post(`/api/v1/teams/${teamId}/incidents`)
      .send({ title: 'Stale alert', description: '', severity: 'low' })

    const del = await agent.delete(`/api/v1/teams/${teamId}/incidents/${created.body.id}`)
    expect(del.status).toBe(204)

    const getAfter = await agent.get(`/api/v1/teams/${teamId}/incidents/${created.body.id}`)
    expect(getAfter.status).toBe(404)
  })
})
