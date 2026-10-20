import cors from 'cors'
import express from 'express'
import { createSessionMiddleware } from './auth/session'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { incidentsRouter } from './routes/incidents'
import { teamsRouter } from './routes/teams'

export function createApp() {
  const app = express()

  // Render (and most PaaS hosts) terminate TLS at a reverse proxy and
  // forward plain HTTP internally, setting `X-Forwarded-Proto` to say
  // the original request was https. Without this, Express thinks every
  // request is plain HTTP, and the session cookie's `secure: true` in
  // production would mean the cookie never gets set at all.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
  }

  // `credentials: true` + a reflected (non-wildcard) origin is required
  // for the session cookie to actually be sent cross-origin once the
  // Vite dev server (a different port) starts talking to this API.
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())
  app.use(createSessionMiddleware())

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/teams', teamsRouter)
  app.use('/api/v1/teams/:teamId/incidents', incidentsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
