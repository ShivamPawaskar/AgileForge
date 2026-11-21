import { env } from './config/env.js'
import { connectDatabase } from './config/db.js'
import app from './app.js'

async function start() {
  if (!env.jwtSecret) throw new Error('JWT_SECRET is required. Set it in backend/.env')
  await connectDatabase()
  app.listen(env.port, () => console.info(`AgileForge API listening on port ${env.port}`))
}
start().catch(error => { console.error('Unable to start AgileForge API:', error.message); process.exitCode = 1 })
