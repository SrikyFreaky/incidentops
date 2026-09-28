import cors from 'cors'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { incidentsRouter } from './routes/incidents'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
  app.use('/api/v1/incidents', incidentsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
