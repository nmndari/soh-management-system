import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { query } from './config/db.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import routes from './routes/index.js'
import { UPLOAD_ROOT } from './middlewares/upload.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.corsOrigin }))
  app.use(express.json({ limit: '1mb' }))

  // Сервер болон өгөгдлийн сан ажиллаж байгаа эсэх
  app.get('/health', async (_req, res) => {
    try {
      await query('SELECT 1 AS ok')
      res.json({ status: 'ok', db: 'ok' })
    } catch {
      res.status(503).json({ status: 'error', db: 'unreachable' })
    }
  })

  // Гомдлын зураг. Апп болон вебээс <img>-ээр уншина
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    express.static(UPLOAD_ROOT, { index: false, fallthrough: false }),
  )

  app.use('/api/v1', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
