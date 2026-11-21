import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import User from '../models/User.js'
import UserStory from '../models/UserStory.js'
import Sprint from '../models/Sprint.js'
import Task from '../models/Task.js'
import TestCase from '../models/TestCase.js'
import AppError from '../utils/AppError.js'

const dateValue = (value, field) => {
  if (value === null || value === '') return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new AppError(`${field} must be a valid date`, 400)
  return date
}
export function validateProjectDates(startDate, deadline) {
  const start = startDate == null || startDate === '' ? null : dateValue(startDate, 'Start date')
  const end = deadline == null || deadline === '' ? null : dateValue(deadline, 'Deadline')
  if (start && end && end <= start) throw new AppError('Deadline must be after the start date', 400)
  return { startDate: start, deadline: end }
}
export async function accessibleProject(projectId, userId) {
  const project = await Project.findById(projectId).populate('owner', 'name email role').populate('teamMembers', 'name email role avatarUrl')
  if (!project) throw new AppError('Project not found', 404)
  if (String(project.owner._id) !== String(userId) && !project.teamMembers.some(member => String(member._id) === String(userId))) throw new AppError('You do not have access to this project', 403)
  return project
}
export async function canManage(projectId, userId) {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError('Project not found', 404)
  const member = await ProjectMember.findOne({ projectId, userId })
  if (!member || !['owner', 'admin'].includes(member.role)) throw new AppError('Project owner or admin access is required', 403)
  return project
}
export async function listProjects(userId) {
  const projects = await Project.find({ $or: [{ owner: userId }, { teamMembers: userId }] }).populate('owner', 'name email').populate('teamMembers', 'name email role avatarUrl').sort({ updatedAt: -1 })
  return Promise.all(projects.map(async project => {
    const memberships = await ProjectMember.find({ projectId: project.id }).populate('userId', 'name email role avatarUrl')
    return { ...project.toObject(), members: memberships }
  }))
}
export async function createProject(data, user) {
  const dates = validateProjectDates(data.startDate, data.deadline)
  const project = await Project.create({ name: data.name.trim(), description: data.description || '', problemStatement: data.problemStatement || '', technologyStack: Array.isArray(data.technologyStack) ? data.technologyStack : [], owner: user.id, teamMembers: [user.id], ...dates })
  await ProjectMember.create({ projectId: project.id, userId: user.id, role: 'owner', capacityPoints: 20 })
  return accessibleProject(project.id, user.id)
}
export async function updateProject(projectId, data, userId) {
  await canManage(projectId, userId)
  const changes = {}
  for (const field of ['name', 'description', 'problemStatement', 'technologyStack', 'status']) if (data[field] !== undefined) changes[field] = data[field]
  if (changes.name !== undefined && (!String(changes.name).trim() || String(changes.name).length > 120)) throw new AppError('Project name is required and must be under 120 characters', 400)
  if (changes.technologyStack !== undefined && !Array.isArray(changes.technologyStack)) throw new AppError('Technology stack must be an array', 400)
  if (data.startDate !== undefined || data.deadline !== undefined) {
    const current = await Project.findById(projectId)
    Object.assign(changes, validateProjectDates(data.startDate !== undefined ? data.startDate : current.startDate, data.deadline !== undefined ? data.deadline : current.deadline))
  }
  const project = await Project.findByIdAndUpdate(projectId, changes, { new: true, runValidators: true }).populate('owner', 'name email').populate('teamMembers', 'name email role')
  return project
}
export async function deleteProject(projectId, userId) {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError('Project not found', 404)
  if (String(project.owner) !== String(userId)) throw new AppError('Only the project owner can delete it', 403)
  await Promise.all([ProjectMember.deleteMany({ projectId }), UserStory.deleteMany({ projectId }), Sprint.deleteMany({ projectId }), Task.deleteMany({ projectId }), TestCase.deleteMany({ projectId })])
  await project.deleteOne()
}
export async function listMembers(projectId, userId) {
  await accessibleProject(projectId, userId)
  return ProjectMember.find({ projectId }).populate('userId', 'name email role avatarUrl createdAt').sort({ role: 1, createdAt: 1 })
}
export async function addMember(projectId, data, actorId) {
  const project = await canManage(projectId, actorId)
  const email = String(data.email || '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('A valid email address is required', 400)
  const user = await User.findOne({ email })
  if (!user) throw new AppError('No AgileForge user exists with that email. Ask them to register first.', 404)
  const existing = await ProjectMember.findOne({ projectId, userId: user.id })
  if (existing) throw new AppError('This user is already a project member', 409)
  const role = data.role || 'member'
  if (!['admin', 'member'].includes(role)) throw new AppError('Member role must be admin or member', 400)
  const capacityPoints = data.capacityPoints === undefined ? 20 : Number(data.capacityPoints)
  if (!Number.isFinite(capacityPoints) || capacityPoints < 0 || capacityPoints > 500) throw new AppError('Capacity must be between 0 and 500 points', 400)
  const member = await ProjectMember.create({ projectId, userId: user.id, role, capacityPoints })
  project.teamMembers.addToSet(user.id)
  await project.save()
  return member.populate('userId', 'name email role avatarUrl')
}
export async function addManualMember(projectId, data, actorId) {
  const project = await canManage(projectId, actorId)
  const name = String(data.name || '').trim()
  const email = String(data.email || '').trim().toLowerCase()
  if (name.length < 2 || name.length > 80) throw new AppError('Member name must be between 2 and 80 characters', 400)
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('A valid email address is required', 400)
  if (await User.exists({ email })) throw new AppError('An AgileForge account already uses this email. Use Add existing member instead.', 409)
  const role = data.role || 'member'
  if (!['admin', 'member'].includes(role)) throw new AppError('Member role must be admin or member', 400)
  const capacityPoints = data.capacityPoints === undefined ? 20 : Number(data.capacityPoints)
  if (!Number.isFinite(capacityPoints) || capacityPoints < 0 || capacityPoints > 500) throw new AppError('Capacity must be between 0 and 500 points', 400)
  const temporaryPassword = randomBytes(18).toString('base64url')
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(temporaryPassword, 12), mustChangePassword: true })
  try {
    const member = await ProjectMember.create({ projectId, userId: user.id, role, capacityPoints })
    project.teamMembers.addToSet(user.id)
    await project.save()
    return { member: await member.populate('userId', 'name email role avatarUrl'), temporaryPassword }
  } catch (error) {
    await ProjectMember.deleteOne({ projectId, userId: user.id })
    await User.deleteOne({ _id: user.id })
    throw error
  }
}
export async function updateMember(projectId, memberId, data, actorId) {
  await canManage(projectId, actorId)
  const member = await ProjectMember.findOne({ projectId, userId: memberId })
  if (!member) throw new AppError('Project member not found', 404)
  if (member.role === 'owner' && data.role && data.role !== 'owner') throw new AppError('Project ownership cannot be changed here', 400)
  if (data.role !== undefined) {
    if (!['admin', 'member'].includes(data.role) || member.role === 'owner') throw new AppError('Invalid project member role', 400)
    member.role = data.role
  }
  if (data.capacityPoints !== undefined) {
    const capacity = Number(data.capacityPoints)
    if (!Number.isFinite(capacity) || capacity < 0 || capacity > 500) throw new AppError('Capacity must be between 0 and 500 points', 400)
    member.capacityPoints = capacity
  }
  await member.save()
  return member.populate('userId', 'name email role avatarUrl')
}
export async function removeMember(projectId, memberId, actorId) {
  const project = await canManage(projectId, actorId)
  const member = await ProjectMember.findOne({ projectId, userId: memberId })
  if (!member) throw new AppError('Project member not found', 404)
  if (member.role === 'owner') throw new AppError('The project owner cannot be removed', 400)
  await member.deleteOne()
  project.teamMembers.pull(memberId)
  await project.save()
  await Task.updateMany({ projectId, assignedTo: memberId }, { $set: { assignedTo: null } })
  await UserStory.updateMany({ projectId, assignedTo: memberId }, { $set: { assignedTo: null } })
  return { userId: memberId }
}
export function isObjectId(value) { return mongoose.Types.ObjectId.isValid(value) }
