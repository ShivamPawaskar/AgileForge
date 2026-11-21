import * as projects from '../services/projectService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'

const validateCreate = body => {
  if (typeof body.name !== 'string' || !body.name.trim()) throw new AppError('Project name is required', 400)
  if (body.technologyStack !== undefined && (!Array.isArray(body.technologyStack) || body.technologyStack.some(x => typeof x !== 'string'))) throw new AppError('Technology stack must be an array of strings', 400)
}
export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await projects.listProjects(req.user.id) }))
export const create = asyncHandler(async (req, res) => { validateCreate(req.body); res.status(201).json({ success: true, data: await projects.createProject(req.body, req.user) }) })
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await projects.accessibleProject(req.params.projectId, req.user.id) }))
export const update = asyncHandler(async (req, res) => { if (req.body.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim())) throw new AppError('Project name cannot be empty', 400); res.json({ success: true, data: await projects.updateProject(req.params.projectId, req.body, req.user.id) }) })
export const remove = asyncHandler(async (req, res) => { await projects.deleteProject(req.params.projectId, req.user.id); res.json({ success: true, message: 'Project deleted' }) })
export const members = asyncHandler(async (req, res) => res.json({ success: true, data: await projects.listMembers(req.params.projectId, req.user.id) }))
export const addMember = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await projects.addMember(req.params.projectId, req.body, req.user.id) }))
export const addManualMember = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await projects.addManualMember(req.params.projectId, req.body, req.user.id) }))
export const updateMember = asyncHandler(async (req, res) => res.json({ success: true, data: await projects.updateMember(req.params.projectId, req.params.userId, req.body, req.user.id) }))
export const removeMember = asyncHandler(async (req, res) => res.json({ success: true, data: await projects.removeMember(req.params.projectId, req.params.userId, req.user.id) }))
