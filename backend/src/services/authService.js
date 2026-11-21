import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
import AppError from '../utils/AppError.js'

const issueToken = user => jwt.sign({ sub: user.id, ver: user.authVersion || 0 }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
export const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, mustChangePassword: Boolean(user.mustChangePassword), createdAt: user.createdAt })
export async function register({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  const exists = await User.exists({ email: normalizedEmail })
  if (exists) throw new AppError('An account with this email already exists', 409)
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash })
  return { token: issueToken(user), user: publicUser(user) }
}
export async function login({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash +authVersion')
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Email or password is incorrect', 401)
  return { token: issueToken(user), user: publicUser(user) }
}
export async function logout(user) {
  user.authVersion += 1
  await user.save()
}
export async function updateProfile(user, changes) {
  if (changes.name !== undefined) user.name = changes.name.trim()
  if (changes.email !== undefined) user.email = changes.email.trim().toLowerCase()
  if (changes.avatarUrl !== undefined) user.avatarUrl = changes.avatarUrl
  if (changes.password) { user.passwordHash = await bcrypt.hash(changes.password, 12); user.mustChangePassword = false }
  await user.save()
  return publicUser(user)
}
