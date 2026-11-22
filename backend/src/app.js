import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import AppError from './utils/AppError.js'
const app = express()
app.use(cors({ origin: env.clientUrls }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', service: 'agileforge-api' }))
app.get('/api/health/database', async (req, res) => {
  try {
    await connectDatabase()
    res.json({ success: true, status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('MongoDB health check failed:', error.message)
    res.status(503).json({ success: false, status: 'error', message: 'MongoDB is unavailable. Check MONGODB_URI and the Atlas IP access list.' })
  }
})
const requireDatabase = async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('MongoDB request connection failed:', error.message)
    next(new AppError('MongoDB is unavailable. Check MONGODB_URI and the Atlas IP access list.', 503))
  }
}
app.use('/api/auth', requireDatabase, authRoutes)
app.use('/api/projects', requireDatabase, projectRoutes)
app.use(notFound)
app.use(errorHandler)
export default app
