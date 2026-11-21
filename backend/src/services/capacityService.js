import ProjectMember from '../models/ProjectMember.js'
import Sprint from '../models/Sprint.js'
import UserStory from '../models/UserStory.js'
import Task from '../models/Task.js'
import AppError from '../utils/AppError.js'

export async function assertStoryFitsSprint({ projectId, sprint, story }) {
  if (!story.assignedTo) return
  const membership = await ProjectMember.findOne({ projectId, userId: story.assignedTo }).populate('userId', 'name')
  if (!membership) throw new AppError('Assignee must be a member of this project', 400)
  const existing = await UserStory.aggregate([
    { $match: { projectId: membership.projectId, assignedTo: membership.userId._id, _id: { $in: sprint.selectedStories, $ne: story._id } } },
    { $group: { _id: null, points: { $sum: '$storyPoints' } } },
  ])
  const assignedPoints = existing[0]?.points || 0
  const taskPoints = await Task.aggregate([
    { $match: { projectId: membership.projectId, sprintId: sprint._id, assignedTo: membership.userId._id } },
    { $group: { _id: null, points: { $sum: '$storyPoints' } } },
  ])
  const totalAssigned = assignedPoints + (taskPoints[0]?.points || 0)
  if (totalAssigned + story.storyPoints > membership.capacityPoints) throw new AppError(`${membership.userId.name} would exceed sprint capacity`, 409, {
    code: 'CAPACITY_EXCEEDED', sprintId: sprint.id, capacity: membership.capacityPoints,
    assignedPoints: totalAssigned, requestedPoints: story.storyPoints, remainingPoints: Math.max(0, membership.capacityPoints-totalAssigned), memberId: membership.userId.id,
  })
}

export async function assertStoryAssignmentCapacity({ projectId, storyId, assignedTo, storyPoints }) {
  if (!assignedTo) return
  const membership = await ProjectMember.findOne({ projectId, userId: assignedTo })
  if (!membership) throw new AppError('Assignee must be a member of this project', 400)
  await membership.populate('userId', 'name')
  const sprints = await Sprint.find({ projectId, selectedStories: storyId })
  for (const sprint of sprints) {
    const existing = await UserStory.aggregate([
      { $match: { projectId: membership.projectId, assignedTo: membership.userId._id, _id: { $in: sprint.selectedStories, $ne: storyId } } },
      { $group: { _id: null, points: { $sum: '$storyPoints' } } },
    ])
    const taskPoints = await Task.aggregate([
      { $match: { projectId: membership.projectId, sprintId: sprint._id, assignedTo: membership.userId._id } },
      { $group: { _id: null, points: { $sum: '$storyPoints' } } },
    ])
    const assignedPoints = (existing[0]?.points || 0) + (taskPoints[0]?.points || 0)
    const requestedPoints = Number(storyPoints || 0)
    if (assignedPoints + requestedPoints > membership.capacityPoints) {
      throw new AppError(`${membership.userId.name} would exceed sprint capacity`, 409, {
        code: 'CAPACITY_EXCEEDED', sprintId: sprint.id, capacity: membership.capacityPoints,
        assignedPoints, requestedPoints, remainingPoints: Math.max(0, membership.capacityPoints - assignedPoints), memberId: membership.userId.id,
      })
    }
  }
}

export async function assertTaskAssignmentCapacity({ projectId, sprintId, taskId, assignedTo, storyPoints }) {
  if (!assignedTo || !sprintId) return
  const sprint = await Sprint.findOne({ _id: sprintId, projectId })
  if (!sprint) throw new AppError('Sprint must belong to this project', 400)
  const membership = await ProjectMember.findOne({ projectId, userId: assignedTo }).populate('userId', 'name')
  if (!membership) throw new AppError('Assignee must be a member of this project', 400)
  const stories = await UserStory.aggregate([
    { $match: { projectId: membership.projectId, assignedTo: membership.userId._id, _id: { $in: sprint.selectedStories } } },
    { $group: { _id: null, points: { $sum: '$storyPoints' } } },
  ])
  const taskMatch = { projectId: membership.projectId, sprintId: sprint._id, assignedTo: membership.userId._id }
  if (taskId) taskMatch._id = { $ne: taskId }
  const tasks = await Task.aggregate([
    { $match: taskMatch },
    { $group: { _id: null, points: { $sum: '$storyPoints' } } },
  ])
  const assignedPoints = (stories[0]?.points || 0) + (tasks[0]?.points || 0)
  const requestedPoints = Number(storyPoints || 0)
  if (assignedPoints + requestedPoints > membership.capacityPoints) throw new AppError(`${membership.userId.name} would exceed sprint capacity`, 409, {
    code: 'CAPACITY_EXCEEDED', sprintId: sprint.id, capacity: membership.capacityPoints,
    assignedPoints, requestedPoints, remainingPoints: Math.max(0,membership.capacityPoints-assignedPoints), memberId: membership.userId.id,
  })
}
