import Task from '../models/Task.js'
import mongoose from 'mongoose'
import ProjectMember from '../models/ProjectMember.js'
import Sprint from '../models/Sprint.js'
import UserStory from '../models/UserStory.js'
import { assertTaskAssignmentCapacity } from '../services/capacityService.js'
import * as projects from '../services/projectService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'

const fields = ['sprintId', 'userStoryId', 'dependencies', 'title', 'description', 'type', 'readinessArea', 'assignedTo', 'priority', 'storyPoints', 'status', 'dueDate']
async function checkAssignee(projectId, assignedTo) {
  if (assignedTo && !(await ProjectMember.exists({ projectId, userId: assignedTo }))) throw new AppError('Assignee must be a member of this project', 400)
}
async function checkReferences(projectId, { sprintId, userStoryId }) {
  if (sprintId && !(await Sprint.exists({ _id: sprintId, projectId }))) throw new AppError('Sprint must belong to this project', 400)
  if (userStoryId && !(await UserStory.exists({ _id: userStoryId, projectId }))) throw new AppError('User story must belong to this project', 400)
}
async function checkDependencies(projectId, dependencies, taskId = null) {
  if (dependencies === undefined) return
  if (!Array.isArray(dependencies)) throw new AppError('Task dependencies must be an array of task IDs', 400)
  const ids = dependencies.map(value => String(value?._id || value))
  if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) throw new AppError('Every dependency must be a valid task ID', 400)
  if (new Set(ids).size !== ids.length) throw new AppError('A dependency can only be selected once', 400)
  if (taskId && ids.includes(String(taskId))) throw new AppError('A task cannot depend on itself', 400)
  const matches = await Task.find({ projectId, _id: { $in: ids } }).select('_id dependencies').lean()
  if (matches.length !== ids.length) throw new AppError('Dependencies must be tasks in this project', 400)
  if (!taskId) return
  const projectTasks = await Task.find({ projectId }).select('_id dependencies').lean()
  const graph = new Map(projectTasks.map(task => [String(task._id), (task.dependencies || []).map(String)]))
  const visiting = [...ids]
  const seen = new Set()
  while (visiting.length) {
    const current = visiting.pop()
    if (current === String(taskId)) throw new AppError('This dependency would create a circular task flow', 400)
    if (seen.has(current)) continue
    seen.add(current)
    visiting.push(...(graph.get(current) || []))
  }
}
const taskPopulations = [
  { path: 'assignedTo', select: 'name email avatarUrl' },
  { path: 'userStoryId', select: 'title storyKey' },
  { path: 'dependencies', select: 'title status priority storyPoints assignedTo', populate: { path: 'assignedTo', select: 'name email avatarUrl' } },
]
export const list = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const filter = { projectId: req.params.projectId }
  if (req.query.sprintId) filter.sprintId = req.query.sprintId
  if (req.query.status) filter.status = req.query.status
  const data = await Task.find(filter).populate(taskPopulations).sort({ createdAt: -1 })
  res.json({ success: true, data })
})
export const create = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  if (!req.body.title?.trim()) throw new AppError('Task title is required', 400)
  await checkAssignee(req.params.projectId, req.body.assignedTo)
  await checkReferences(req.params.projectId, req.body)
  await checkDependencies(req.params.projectId, req.body.dependencies)
  await assertTaskAssignmentCapacity({ projectId: req.params.projectId, sprintId: req.body.sprintId, assignedTo: req.body.assignedTo, storyPoints: req.body.storyPoints })
  const task = await Task.create({ ...Object.fromEntries(Object.entries(req.body).filter(([key]) => fields.includes(key))), projectId: req.params.projectId, title: req.body.title.trim(), statusHistory: [{ previousStatus: null, status: req.body.status || 'todo', changedBy: req.user.id }] })
  res.status(201).json({ success: true, data: task })
})
export const update = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  if (req.body.assignedTo !== undefined) await checkAssignee(req.params.projectId, req.body.assignedTo)
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => fields.includes(key)))
  const task = await Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId })
  if (!task) throw new AppError('Task not found', 404)
  await checkDependencies(req.params.projectId, changes.dependencies, task.id)
  await checkReferences(req.params.projectId, { sprintId: changes.sprintId === undefined ? task.sprintId : changes.sprintId, userStoryId: changes.userStoryId === undefined ? task.userStoryId : changes.userStoryId })
  if (changes.assignedTo !== undefined || changes.sprintId !== undefined || changes.storyPoints !== undefined) {
    await assertTaskAssignmentCapacity({ projectId: req.params.projectId, sprintId: changes.sprintId === undefined ? task.sprintId : changes.sprintId, taskId: task.id, assignedTo: changes.assignedTo === undefined ? task.assignedTo : changes.assignedTo, storyPoints: changes.storyPoints === undefined ? task.storyPoints : changes.storyPoints })
  }
  const previousStatus = task.status
  Object.assign(task, changes)
  if (changes.status && changes.status !== previousStatus) task.statusHistory.push({ previousStatus, status: changes.status, changedBy: req.user.id })
  await task.save()
  res.json({ success: true, data: await task.populate(taskPopulations) })
})
export const remove = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const task = await Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId })
  if (!task) throw new AppError('Task not found', 404)
  if (await Task.exists({ projectId: req.params.projectId, dependencies: task._id })) throw new AppError('This task is a dependency for other work. Remove it from those task flows before deleting it.', 409)
  await task.deleteOne()
  res.json({ success: true, data: { id: task.id } })
})
