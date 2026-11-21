import { Router } from 'express'
import * as projects from '../controllers/projectController.js'
import * as tasks from '../controllers/taskController.js'
import * as sprints from '../controllers/sprintController.js'
import * as stories from '../controllers/userStoryController.js'
import * as testCases from '../controllers/testCaseController.js'
import * as readiness from '../controllers/readinessController.js'
import { requireAuth } from '../middleware/auth.js'
import { validateObjectIds } from '../middleware/validateObjectIds.js'
const router = Router()
router.use(requireAuth)
router.get('/', projects.list)
router.post('/', projects.create)
router.param('projectId', (req, res, next, id) => validateObjectIds('projectId')(req, res, next))
router.get('/:projectId', projects.get)
router.patch('/:projectId', projects.update)
router.delete('/:projectId', projects.remove)
router.get('/:projectId/members', projects.members)
router.post('/:projectId/members', projects.addMember)
router.post('/:projectId/members/manual', projects.addManualMember)
router.patch('/:projectId/members/:userId', validateObjectIds('userId'), projects.updateMember)
router.delete('/:projectId/members/:userId', validateObjectIds('userId'), projects.removeMember)
router.get('/:projectId/tasks', tasks.list)
router.post('/:projectId/tasks', tasks.create)
router.patch('/:projectId/tasks/:taskId', validateObjectIds('taskId'), tasks.update)
router.delete('/:projectId/tasks/:taskId', validateObjectIds('taskId'), tasks.remove)
router.get('/:projectId/metrics', sprints.projectMetrics)
router.get('/:projectId/sprints', sprints.list)
router.post('/:projectId/sprints', sprints.create)
router.patch('/:projectId/sprints/:sprintId', validateObjectIds('sprintId'), sprints.update)
router.delete('/:projectId/sprints/:sprintId', validateObjectIds('sprintId'), sprints.remove)
router.get('/:projectId/sprints/:sprintId/metrics', validateObjectIds('sprintId'), sprints.metrics)
router.put('/:projectId/sprints/:sprintId/stories/:storyId', validateObjectIds('sprintId','storyId'), sprints.addStory)
router.delete('/:projectId/sprints/:sprintId/stories/:storyId', validateObjectIds('sprintId','storyId'), sprints.removeStory)
router.get('/:projectId/stories', stories.list)
router.post('/:projectId/stories', stories.create)
router.patch('/:projectId/stories/:storyId', validateObjectIds('storyId'), stories.update)
router.delete('/:projectId/stories/:storyId', validateObjectIds('storyId'), stories.remove)
router.get('/:projectId/test-cases', testCases.list)
router.get('/:projectId/readiness', readiness.evaluate)
router.post('/:projectId/test-cases', testCases.create)
router.patch('/:projectId/test-cases/:testCaseId', validateObjectIds('testCaseId'), testCases.update)
router.delete('/:projectId/test-cases/:testCaseId', validateObjectIds('testCaseId'), testCases.remove)
export default router
