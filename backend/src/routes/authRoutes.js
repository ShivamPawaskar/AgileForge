import { Router } from 'express'
import { login, logout, me, profile, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.patch('/me', requireAuth, profile)
router.post('/logout', requireAuth, logout)
export default router
