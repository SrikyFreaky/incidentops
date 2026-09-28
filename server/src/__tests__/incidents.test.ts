import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { __resetStoreForTests } from '../services/incidentsService'

const app = createApp()

beforeEach(() => {
  __resetStoreForTests()
})

describe('POST /api/v1/incidents', () => {
  it('creates an incident with valid input', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .send({ title: 'Checkout API down', description: 'All EU regions', severity: 'high' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      title: 'Checkout API down',
      severity: 'high',
      status: 'open',
    })
    expect(res.body.id).toBeTypeOf('string')
  })

  it('rejects a malformed JSON body with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Content-Type', 'application/json')
      .send('{"title": "missing closing brace"')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('rejects an invalid title with 400', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .send({ title: 'ab', description: '', severity: 'high' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })
})

describe('GET /api/v1/incidents/:id', () => {
  it('returns 404 for a missing incident', async () => {
    const res = await request(app).get('/api/v1/incidents/00000000-0000-0000-0000-000000000000')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/v1/incidents/not-a-uuid')

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/v1/incidents/:id/status', () => {
  it('rejects an illegal transition with 409', async () => {
    const created = await request(app)
      .post('/api/v1/incidents')
      .send({ title: 'Payments failing', description: '', severity: 'critical' })

    await request(app)
      .patch(`/api/v1/incidents/${created.body.id}/status`)
      .send({ status: 'resolved' })

    const res = await request(app)
      .patch(`/api/v1/incidents/${created.body.id}/status`)
      .send({ status: 'investigating' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('allows a legal transition', async () => {
    const created = await request(app)
      .post('/api/v1/incidents')
      .send({ title: 'DB latency spike', description: '', severity: 'medium' })

    const res = await request(app)
      .patch(`/api/v1/incidents/${created.body.id}/status`)
      .send({ status: 'investigating' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('investigating')
  })
})

describe('GET /api/v1/incidents', () => {
  it('paginates with a cursor', async () => {
    for (const title of ['Incident A', 'Incident B', 'Incident C']) {
      await request(app)
        .post('/api/v1/incidents')
        .send({ title, description: '', severity: 'low' })
    }

    const firstPage = await request(app).get('/api/v1/incidents?limit=2')
    expect(firstPage.status).toBe(200)
    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.nextCursor).not.toBeNull()

    const secondPage = await request(app).get(
      `/api/v1/incidents?limit=2&cursor=${firstPage.body.nextCursor}`,
    )
    expect(secondPage.status).toBe(200)
    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.nextCursor).toBeNull()
  })
})

describe('DELETE /api/v1/incidents/:id', () => {
  it('removes an incident and 404s afterward', async () => {
    const created = await request(app)
      .post('/api/v1/incidents')
      .send({ title: 'Stale alert', description: '', severity: 'low' })

    const del = await request(app).delete(`/api/v1/incidents/${created.body.id}`)
    expect(del.status).toBe(204)

    const getAfter = await request(app).get(`/api/v1/incidents/${created.body.id}`)
    expect(getAfter.status).toBe(404)
  })
})
