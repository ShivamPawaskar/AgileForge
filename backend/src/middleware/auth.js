import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  if (!token) throw new AppError('Authentication required', 401)
  let payload
  try { payload = jwt.verify(token, env.jwtSecret) } catch { throw new AppError('Invalid or expired token', 401) }
  const user = await User.findById(payload.sub).select('+authVersion -passwordHash')
  if (!user) throw new AppError('Account not found', 401)
  if ((payload.ver || 0) !== user.authVersion) throw new AppError('Session has expired. Please sign in again.', 401)
  req.user = user
  next()
})
