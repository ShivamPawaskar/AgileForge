import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
const app = express()
app.use(cors({ origin: env.clientUrl }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', service: 'agileforge-api' }))
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use(notFound)
app.use(errorHandler)
export default app
