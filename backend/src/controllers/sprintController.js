import Sprint from '../models/Sprint.js'
import Task from '../models/Task.js'
import UserStory from '../models/UserStory.js'
import ProjectMember from '../models/ProjectMember.js'
import * as projects from '../services/projectService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import { assertStoryFitsSprint } from '../services/capacityService.js'

export const list = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const data = await Sprint.find({ projectId: req.params.projectId }).populate('selectedStories').sort({ startDate: 1, createdAt: 1 })
  res.json({ success: true, data })
})
export const create = asyncHandler(async (req, res) => {
  await projects.canManage(req.params.projectId, req.user.id)
  if (!req.body.name?.trim() || !req.body.startDate || !req.body.endDate) throw new AppError('Name, start date, and end date are required', 400)
  if (req.body.selectedStories?.length) {
    const count = await UserStory.countDocuments({ projectId: req.params.projectId, _id: { $in: req.body.selectedStories } })
    if (count !== req.body.selectedStories.length) throw new AppError('Every selected story must belong to this project', 400)
  }
  const data = await Sprint.create({ ...req.body, projectId: req.params.projectId, name: req.body.name.trim() })
  res.status(201).json({ success: true, data })
})
export const update = asyncHandler(async (req, res) => {
  await projects.canManage(req.params.projectId, req.user.id)
  const allowed = ['name','sprintGoal','startDate','endDate','selectedStories','status']
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)))
  if (changes.selectedStories && changes.selectedStories.length) {
    const count = await UserStory.countDocuments({ projectId: req.params.projectId, _id: { $in: changes.selectedStories } })
    if (count !== changes.selectedStories.length) throw new AppError('Every selected story must belong to this project', 400)
  }
  const item = await Sprint.findOne({ _id: req.params.sprintId, projectId: req.params.projectId })
  if (!item) throw new AppError('Sprint not found', 404)
  Object.assign(item, changes)
  await item.save()
  res.json({ success: true, data: await item.populate('selectedStories') })
})
export const remove = asyncHandler(async (req, res) => {
  await projects.canManage(req.params.projectId, req.user.id)
  const item = await Sprint.findOneAndDelete({ _id: req.params.sprintId, projectId: req.params.projectId })
  if (!item) throw new AppError('Sprint not found', 404)
  await Task.updateMany({ sprintId: item.id }, { $set: { sprintId: null } })
  res.json({ success: true, data: { id: item.id } })
})

export const addStory = asyncHandler(async (req, res) => {
  await projects.canManage(req.params.projectId, req.user.id)
  const sprint = await Sprint.findOne({ _id: req.params.sprintId, projectId: req.params.projectId })
  if (!sprint) throw new AppError('Sprint not found', 404)
  const story = await UserStory.findOne({ _id: req.params.storyId, projectId: req.params.projectId })
  if (!story) throw new AppError('User story not found in this project', 404)
  if (sprint.selectedStories.some(id => String(id) === story.id)) throw new AppError('This story is already selected in the sprint', 409)
  await assertStoryFitsSprint({ projectId: req.params.projectId, sprint, story })
  sprint.selectedStories.addToSet(story.id)
  await sprint.save()
  res.status(200).json({ success: true, data: await sprint.populate('selectedStories') })
})

export const removeStory = asyncHandler(async (req, res) => {
  await projects.canManage(req.params.projectId, req.user.id)
  const sprint = await Sprint.findOne({ _id: req.params.sprintId, projectId: req.params.projectId })
  if (!sprint) throw new AppError('Sprint not found', 404)
  sprint.selectedStories.pull(req.params.storyId)
  await sprint.save()
  res.json({ success: true, data: await sprint.populate('selectedStories') })
})

export const metrics = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const sprint = await Sprint.findOne({ _id: req.params.sprintId, projectId: req.params.projectId }).populate({ path: 'selectedStories', populate: { path: 'assignedTo', select: 'name email' } })
  if (!sprint) throw new AppError('Sprint not found', 404)
  const stories = sprint.selectedStories
  const tasks = await Task.find({ projectId: req.params.projectId, sprintId: sprint.id }).populate('assignedTo', 'name email')
  const memberships = await ProjectMember.find({ projectId: req.params.projectId }).populate('userId', 'name email')
  const members = memberships.map(member => {
    const assigned = stories.filter(story => String(story.assignedTo?._id || story.assignedTo) === String(member.userId._id))
    const assignedTasks = tasks.filter(task => String(task.assignedTo?._id || task.assignedTo) === String(member.userId._id))
    const assignedStoryPoints = assigned.reduce((sum, story) => sum + story.storyPoints, 0)
    const assignedTaskPoints = assignedTasks.reduce((sum, task) => sum + task.storyPoints, 0)
    const assignedPoints = assignedStoryPoints + assignedTaskPoints
    return { userId: member.userId.id, name: member.userId.name, role: member.role, capacityPoints: member.capacityPoints, assignedStoryPoints, assignedTaskPoints, assignedPoints, remainingCapacity: member.capacityPoints - assignedPoints, overloaded: assignedPoints > member.capacityPoints }
  })
  const priorityDistribution = ['critical','high','medium','low'].map(priority => {
    const storyItems = stories.filter(story => story.priority === priority)
    const taskItems = tasks.filter(task => task.priority === priority)
    return { priority, count: storyItems.length + taskItems.length, storyPoints: [...storyItems,...taskItems].reduce((sum, item) => sum + item.storyPoints, 0) }
  })
  const durationDays = Math.max(1, Math.ceil((sprint.endDate - sprint.startDate) / 86400000))
  const now = new Date()
  const elapsedRatio = Math.max(0, Math.min(1, (now - sprint.startDate) / (sprint.endDate - sprint.startDate)))
  const totalTaskPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0)
  const completedTasks = tasks.filter(task => task.status === 'done')
  const completedPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0)
  const overdueTasks = tasks.filter(task => task.status !== 'done' && task.dueDate && task.dueDate < now)
  const completionRatio = totalTaskPoints ? completedPoints / totalTaskPoints : tasks.length ? completedTasks.length / tasks.length : 0
  const paceGap = elapsedRatio * 100 - completionRatio * 100
  let health = 'On Track'
  if ((sprint.status === 'completed' || (tasks.length > 0 && completedTasks.length === tasks.length)) && tasks.length > 0) health = 'Completed'
  else if (!tasks.length) health = 'At Risk'
  else if (paceGap > 20 || (overdueTasks.length > 0 && elapsedRatio >= 0.5)) health = 'Delayed'
  else if (paceGap > 10 || overdueTasks.length > 0) health = 'At Risk'
  const taskDistribution = ['todo','in_progress','in_review','done'].map(status => ({ status, count: tasks.filter(task => task.status === status).length }))
  const elapsedDays = Math.max(0, Math.min(durationDays, Math.floor((now - sprint.startDate) / 86400000)))
  const burndown = Array.from({ length: elapsedDays + 1 }, (_, day) => {
    const date = new Date(sprint.startDate); date.setDate(date.getDate() + day)
    return { day: `Day ${day}`, date: date.toISOString().slice(0,10), remaining: totalTaskPoints, ideal: Math.round(totalTaskPoints * (1 - day / durationDays)) }
  })
  // Use each task's latest persisted status transition at the end of each day.
  for (const point of burndown) {
    const endOfDay = new Date(`${point.date}T23:59:59.999Z`)
    const scope = tasks.filter(task => new Date(task.createdAt) <= endOfDay)
    const doneByDay = scope.reduce((sum, task) => {
      const latest = [...task.statusHistory].filter(entry => new Date(entry.changedAt) <= endOfDay).sort((a,b) => new Date(b.changedAt) - new Date(a.changedAt))[0]
      return sum + (latest?.status === 'done' ? task.storyPoints : 0)
    }, 0)
    point.remaining = scope.reduce((sum, task) => sum + task.storyPoints, 0) - doneByDay
  }
  const storyPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)
  const completedStories = stories.filter(story => story.status === 'done').length
  res.json({ success: true, data: { sprintId: sprint.id, sprintName: sprint.name, status: sprint.status, startDate: sprint.startDate, endDate: sprint.endDate, durationDays, elapsedPercent: Math.round(elapsedRatio * 100), totalStories: stories.length, completedStories, totalTasks: tasks.length, completedTasks: completedTasks.length, pendingTasks: taskDistribution[0].count, inProgressTasks: taskDistribution[1].count, overdueTasks: overdueTasks.length, completionPercent: Math.round(completionRatio * 100), totalStoryPoints: storyPoints, totalTaskPoints, completedStoryPoints: completedPoints, remainingStoryPoints: totalTaskPoints - completedPoints, members, priorityDistribution, taskDistribution, burndown, health } })
})

export const projectMetrics = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const sprints = await Sprint.find({ projectId: req.params.projectId }).sort({ startDate: 1, createdAt: 1 })
  const tasks = await Task.find({ projectId: req.params.projectId, sprintId: { $in: sprints.map(sprint => sprint._id) } }).lean()
  const now = new Date()
  const summaries = sprints.map(sprint => {
    const sprintTasks = tasks.filter(task => String(task.sprintId) === String(sprint._id))
    const totalTaskPoints = sprintTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0)
    const completedTasks = sprintTasks.filter(task => task.status === 'done')
    const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0)
    const overdueTasks = sprintTasks.filter(task => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now).length
    const duration = new Date(sprint.endDate) - new Date(sprint.startDate)
    const elapsedRatio = duration > 0 ? Math.max(0, Math.min(1, (now - new Date(sprint.startDate)) / duration)) : 0
    const completionRatio = totalTaskPoints ? completedStoryPoints / totalTaskPoints : sprintTasks.length ? completedTasks.length / sprintTasks.length : 0
    const paceGap = elapsedRatio * 100 - completionRatio * 100
    let health = 'On Track'
    if (sprintTasks.length && (sprint.status === 'completed' || completedTasks.length === sprintTasks.length)) health = 'Completed'
    else if (!sprintTasks.length) health = 'At Risk'
    else if (paceGap > 20 || (overdueTasks && elapsedRatio >= .5)) health = 'Delayed'
    else if (paceGap > 10 || overdueTasks) health = 'At Risk'
    return { sprintId: sprint.id, name: sprint.name, status: sprint.status, startDate: sprint.startDate, endDate: sprint.endDate, totalTasks: sprintTasks.length, completedTasks: completedTasks.length, pendingTasks: sprintTasks.filter(task => task.status === 'todo').length, inProgressTasks: sprintTasks.filter(task => task.status === 'in_progress').length, inReviewTasks: sprintTasks.filter(task => task.status === 'in_review').length, overdueTasks, totalTaskPoints, completedStoryPoints, remainingStoryPoints: totalTaskPoints - completedStoryPoints, completionPercent: Math.round(completionRatio * 100), health }
  })
  const totals = summaries.reduce((result, sprint) => {
    for (const key of ['totalTasks','completedTasks','pendingTasks','inProgressTasks','inReviewTasks','overdueTasks','totalTaskPoints','completedStoryPoints','remainingStoryPoints']) result[key] += sprint[key]
    return result
  }, { totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, inReviewTasks: 0, overdueTasks: 0, totalTaskPoints: 0, completedStoryPoints: 0, remainingStoryPoints: 0 })
  const completionRatio = totals.totalTaskPoints ? totals.completedStoryPoints / totals.totalTaskPoints : totals.totalTasks ? totals.completedTasks / totals.totalTasks : 0
  res.json({ success: true, data: { ...totals, completionPercent: Math.round(completionRatio * 100), totalSprints: summaries.length, completedSprints: summaries.filter(sprint => sprint.status === 'completed' || sprint.health === 'Completed').length, taskDistribution: [
    { status: 'todo', count: totals.pendingTasks }, { status: 'in_progress', count: totals.inProgressTasks }, { status: 'in_review', count: totals.inReviewTasks }, { status: 'done', count: totals.completedTasks },
  ], sprints: summaries } })
})
