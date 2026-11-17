import { createApp } from './app.js'
import { closePool, getPool } from './config/db.js'
import { env } from './config/env.js'

const app = createApp()

try {
  await getPool()
  console.log(`Өгөгдлийн сантай холбогдлоо: ${env.db.server}/${env.db.database}`)
} catch (err) {
  console.error('Өгөгдлийн сантай холбогдож чадсангүй:', err.message)
  process.exit(1)
}

const server = app.listen(env.port, () => {
  console.log(`СӨХ API: http://localhost:${env.port}/api/v1`)
})

const shutdown = async () => {
  server.close()
  await closePool()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
