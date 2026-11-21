import { randomBytes } from 'node:crypto'
import UserStory from '../models/UserStory.js'
import Sprint from '../models/Sprint.js'
import Task from '../models/Task.js'
import * as projects from '../services/projectService.js'
import { assertStoryAssignmentCapacity } from '../services/capacityService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'

const editable = ['title', 'description', 'acceptanceCriteria', 'priority', 'storyPoints', 'assignedTo', 'status']
const filters = new Set(['backlog', 'ready', 'in_progress', 'done'])
const priorities = new Set(['critical', 'high', 'medium', 'low'])
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const list = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const query = { projectId: req.params.projectId }
  if (req.query.q) { const search = escapeRegex(String(req.query.q).slice(0,100)); query.$or = [{ title: { $regex: search, $options: 'i' } }, { storyKey: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] }
  if (req.query.priority) {
    if (!priorities.has(req.query.priority)) throw new AppError('Priority filter must be critical, high, medium, or low', 400)
    query.priority = req.query.priority
  }
  if (req.query.status) {
    if (!filters.has(req.query.status)) throw new AppError('Invalid user story status filter', 400)
    query.status = req.query.status
  }
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo
  const data = await UserStory.find(query).populate('assignedTo', 'name email avatarUrl').sort({ createdAt: -1 })
  res.json({ success: true, data })
})

export const create = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  if (typeof req.body.title !== 'string' || !req.body.title.trim()) throw new AppError('Story title is required', 400)
  if (req.body.acceptanceCriteria !== undefined && !Array.isArray(req.body.acceptanceCriteria)) throw new AppError('Acceptance criteria must be a list', 400)
  const storyKey = `US-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`
  const values = Object.fromEntries(Object.entries(req.body).filter(([key]) => editable.includes(key)))
  if (values.assignedTo) await assertStoryAssignmentCapacity({ projectId: req.params.projectId, storyId: null, assignedTo: values.assignedTo, storyPoints: values.storyPoints })
  const data = await UserStory.create({ ...values, projectId: req.params.projectId, storyKey, title: req.body.title.trim() })
  res.status(201).json({ success: true, data: await data.populate('assignedTo', 'name email avatarUrl') })
})

export const update = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  if (req.body.title !== undefined && (typeof req.body.title !== 'string' || !req.body.title.trim())) throw new AppError('Story title cannot be empty', 400)
  if (req.body.acceptanceCriteria !== undefined && !Array.isArray(req.body.acceptanceCriteria)) throw new AppError('Acceptance criteria must be a list', 400)
  const story = await UserStory.findOne({ _id: req.params.storyId, projectId: req.params.projectId })
  if (!story) throw new AppError('User story not found', 404)
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => editable.includes(key)))
  const capacityChange = changes.assignedTo !== undefined || changes.storyPoints !== undefined
  if (capacityChange) {
    const selectedInSprint = await Sprint.exists({ projectId: req.params.projectId, selectedStories: story.id })
    if (selectedInSprint) await projects.canManage(req.params.projectId, req.user.id)
  }
  const assignedTo = changes.assignedTo === undefined ? story.assignedTo : changes.assignedTo
  const storyPoints = changes.storyPoints === undefined ? story.storyPoints : changes.storyPoints
  if (capacityChange && assignedTo) await assertStoryAssignmentCapacity({ projectId: req.params.projectId, storyId: story.id, assignedTo, storyPoints })
  Object.assign(story, changes)
  await story.save()
  res.json({ success: true, data: await story.populate('assignedTo', 'name email avatarUrl') })
})

export const remove = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const story = await UserStory.findOneAndDelete({ _id: req.params.storyId, projectId: req.params.projectId })
  if (!story) throw new AppError('User story not found', 404)
  await Promise.all([
    Sprint.updateMany({ projectId: req.params.projectId, selectedStories: story.id }, { $pull: { selectedStories: story.id } }),
    Task.updateMany({ projectId: req.params.projectId, userStoryId: story.id }, { $set: { userStoryId: null } }),
  ])
  res.json({ success: true, data: { id: story.id, storyKey: story.storyKey } })
})
