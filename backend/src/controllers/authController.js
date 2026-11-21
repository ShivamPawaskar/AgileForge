import * as authService from '../services/authService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
const validate = (body, isRegister = false) => {
  if (isRegister && (!body.name || body.name.trim().length < 2)) throw new AppError('Name must contain at least 2 characters', 400)
  if (!/^\S+@\S+\.\S+$/.test(body.email || '')) throw new AppError('A valid email is required', 400)
  if (typeof body.password !== 'string' || body.password.length < 8) throw new AppError('Password must be at least 8 characters', 400)
}
export const register = asyncHandler(async (req, res) => { validate(req.body, true); res.status(201).json({ success: true, data: await authService.register(req.body) }) })
export const login = asyncHandler(async (req, res) => { validate(req.body); res.json({ success: true, data: await authService.login(req.body) }) })
export const me = asyncHandler(async (req, res) => { res.json({ success: true, data: { user: authService.publicUser(req.user) } }) })
export const profile = asyncHandler(async (req, res) => {
  const changes = {}
  if (req.body.name !== undefined) {
    if (typeof req.body.name !== 'string' || req.body.name.trim().length < 2) throw new AppError('Name must contain at least 2 characters', 400)
    changes.name = req.body.name
  }
  if (req.body.email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(req.body.email)) throw new AppError('A valid email is required', 400)
    changes.email = req.body.email
  }
  if (req.body.password !== undefined) {
    if (typeof req.body.password !== 'string' || req.body.password.length < 8) throw new AppError('Password must be at least 8 characters', 400)
    changes.password = req.body.password
  }
  if (req.body.avatarUrl !== undefined) {
    if (typeof req.body.avatarUrl !== 'string') throw new AppError('Profile photo must be a valid image', 400)
    if (req.body.avatarUrl === '') changes.avatarUrl = ''
    else {
      const match = req.body.avatarUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
      if (!match) throw new AppError('Profile photo must be PNG, JPEG, or WebP', 400)
      const imageBytes = Buffer.from(match[2], 'base64')
      if (imageBytes.byteLength > 200 * 1024) throw new AppError('Profile photo must be smaller than 200 KB after resizing', 400)
      const validSignature = match[1] === 'png'
        ? imageBytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
        : match[1] === 'jpeg'
          ? imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff
          : imageBytes.subarray(0, 4).toString() === 'RIFF' && imageBytes.subarray(8, 12).toString() === 'WEBP'
      if (!validSignature) throw new AppError('The selected file is not a valid image', 400)
      changes.avatarUrl = req.body.avatarUrl
    }
  }
  const user = await authService.updateProfile(req.user, changes)
  res.json({ success: true, data: { user } })
})
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user)
  res.json({ success: true, message: 'Signed out successfully' })
})
