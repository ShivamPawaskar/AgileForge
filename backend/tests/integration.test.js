import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.JWT_SECRET = 'agileforge-integration-test-secret-long-enough'
process.env.NODE_ENV = 'test'
const { default: app } = await import('../src/app.js')
const dbName = `agileforge_qa_${Date.now()}`
let server
let baseUrl

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, payload: await response.json() }
}

before(async () => {
  await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`)
  server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  if (mongoose.connection.readyState) {
    await mongoose.disconnect()
    console.info(`MongoDB QA records retained in database: ${dbName}`)
  }
})

test('registration, login, protected project CRUD, membership roles/capacity, and logout', async () => {
  const suffix = Date.now()
  let result = await request('/auth/register', { method: 'POST', body: { name: 'Jordan Davis', email: `owner-${suffix}@agileforge.test`, password: 'test-password-123' } })
  assert.equal(result.response.status, 201)
  const ownerToken = result.payload.data.token
  const ownerId = result.payload.data.user.id
  assert.ok(ownerToken)
  assert.equal(result.payload.data.user.role, 'user')

  result = await request('/auth/register', { method: 'POST', body: {} })
  assert.equal(result.response.status, 400, 'empty registration is rejected')
  result = await request('/auth/register', { method: 'POST', body: { name: 'Bad Email', email: 'invalid', password: 'test-password-123' } })
  assert.equal(result.response.status, 400, 'malformed email is rejected')

  result = await request('/auth/register', { method: 'POST', body: { name: 'Jordan Davis', email: `owner-${suffix}@agileforge.test`, password: 'test-password-123' } })
  assert.equal(result.response.status, 409, 'duplicate email should be rejected')

  result = await request('/auth/register', { method: 'POST', body: { name: 'Lana Steiner', email: `member-${suffix}@agileforge.test`, password: 'test-password-456' } })
  assert.equal(result.response.status, 201)
  const memberToken = result.payload.data.token

  result = await request('/auth/login', { method: 'POST', body: { email: `owner-${suffix}@agileforge.test`, password: 'test-password-123' } })
  assert.equal(result.response.status, 200)
  assert.ok(result.payload.data.token)
  result = await request('/auth/login', { method: 'POST', body: { email: `owner-${suffix}@agileforge.test`, password: 'wrong-password' } })
  assert.equal(result.response.status, 401)
  result = await request('/projects')
  assert.equal(result.response.status, 401, 'project routes must require authentication')
  result = await request('/api-route-that-does-not-exist')
  assert.equal(result.response.status, 404, 'unknown API routes return a structured not-found error')
  assert.equal(result.payload.success, false)

  result = await request('/projects', { token: ownerToken, method: 'POST', body: { name: 'LaunchPad', description: 'Build a launch MVP', problemStatement: 'Teams lose focus', technologyStack: ['React', 'Node'], startDate: '2026-11-21', deadline: '2026-11-25' } })
  assert.equal(result.response.status, 201, result.payload.message)
  const projectId = result.payload.data._id
  assert.equal(String(result.payload.data.owner._id), ownerId)
  assert.equal(result.payload.data.name, 'LaunchPad')
  result = await request('/projects', { token: ownerToken, method: 'POST', body: {} })
  assert.equal(result.response.status, 400, 'empty project submissions are rejected')

  result = await request(`/projects/${projectId}`, { token: ownerToken, method: 'PATCH', body: { name: 'LaunchPad MVP', deadline: '2026-11-26', description: 'Updated plan' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.name, 'LaunchPad MVP')
  assert.equal(result.payload.data.description, 'Updated plan')
  result = await request(`/projects/${projectId}`, { token: ownerToken, method: 'PATCH', body: { startDate: '2026-11-27', deadline: '2026-11-26' } })
  assert.equal(result.response.status, 400, 'invalid date order should be rejected')
  result = await request('/projects/not-an-object-id', { token: ownerToken })
  assert.equal(result.response.status, 400, 'invalid project ids should be rejected')
  result = await request('/projects/000000000000000000000001', { token: ownerToken })
  assert.equal(result.response.status, 404, 'valid but missing project id returns not found')

  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Create project demo', assignedTo: ownerId, type: 'frontend', priority: 'high', storyPoints: 5 } })
  assert.equal(result.response.status, 201, result.payload.message)
  const taskId = result.payload.data._id
  assert.equal(result.payload.data.statusHistory.length, 1)
  result = await request(`/projects/${projectId}/tasks/${taskId}`, { token: ownerToken, method: 'PATCH', body: { status: 'in_progress' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.statusHistory.length, 2)
  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.some(task => task._id === taskId), true)
  result = await request(`/projects/${projectId}/tasks/${taskId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)

  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'As a judge, I can try the MVP', acceptanceCriteria: ['Demo path is available'], storyPoints: 3 } })
  assert.equal(result.response.status, 201)
  const storyId = result.payload.data._id
  assert.match(result.payload.data.storyKey, /^US-/)
  result = await request(`/projects/${projectId}/stories/${storyId}`, { token: ownerToken, method: 'PATCH', body: { title: 'As a judge, I can run the MVP demo', priority: 'critical', status: 'ready' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.priority, 'critical')
  result = await request(`/projects/${projectId}/stories?q=judge&priority=critical&status=ready`, { token: ownerToken })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.length, 1)
  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'Invalid point estimate', storyPoints: 4 } })
  assert.equal(result.response.status, 400, 'invalid story point values should be rejected')
  result = await request(`/projects/${projectId}/sprints`, { token: ownerToken, method: 'POST', body: { name: 'Sprint 1', sprintGoal: 'Make the demo path work', startDate: '2020-11-21', endDate: '2020-11-24', selectedStories: [storyId] } })
  assert.equal(result.response.status, 201, result.payload.message)
  const sprintId = result.payload.data._id
  const scenarioA = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Pending core workflow', sprintId, storyPoints: 2, readinessArea: 'core_workflow', dueDate: '2020-01-01' } })
  assert.equal(scenarioA.response.status, 201)
  const scenarioB = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Pending support work', sprintId, storyPoints: 1 } })
  assert.equal(scenarioB.response.status, 201)
  result = await request(`/projects/${projectId}/tasks/${scenarioB.payload.data._id}`, { token: ownerToken, method: 'PATCH', body: { dependencies: [scenarioA.payload.data._id] } })
  assert.equal(result.response.status, 200, 'a task can save a same-project prerequisite')
  assert.equal(result.payload.data.dependencies[0].title, 'Pending core workflow', 'task dependencies are returned populated for the flow diagram')
  result = await request(`/projects/${projectId}/tasks/${scenarioA.payload.data._id}`, { token: ownerToken, method: 'PATCH', body: { dependencies: [scenarioB.payload.data._id] } })
  assert.equal(result.response.status, 400, 'a dependency cycle is rejected')
  result = await request(`/projects/${projectId}/tasks/${scenarioA.payload.data._id}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 409, 'a task with downstream dependents cannot be deleted')
  result = await request(`/projects/${projectId}/tasks/${scenarioB.payload.data._id}`, { token: ownerToken, method: 'PATCH', body: { dependencies: [] } })
  assert.equal(result.response.status, 200, 'a saved prerequisite can be removed')
  result = await request(`/projects/${projectId}/sprints/${sprintId}/metrics`, { token: ownerToken })
  assert.equal(result.payload.data.pendingTasks, 2, 'all-pending scenario is reflected in live sprint metrics')
  assert.equal(result.payload.data.overdueTasks, 1, 'overdue work is counted from due dates')
  assert.equal(result.payload.data.health, 'Delayed', 'late overdue work produces delayed health')
  result = await request(`/projects/${projectId}/tasks/${scenarioA.payload.data._id}`, { token: ownerToken, method: 'PATCH', body: { status: 'done' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.statusHistory.at(-1).previousStatus, 'todo')
  assert.equal(result.payload.data.statusHistory.at(-1).status, 'done')
  assert.ok(result.payload.data.statusHistory.at(-1).changedAt)
  result = await request(`/projects/${projectId}/sprints/${sprintId}/metrics`, { token: ownerToken })
  assert.equal(result.payload.data.completedTasks, 1, 'partial completion is recalculated')
  assert.equal(result.payload.data.completionPercent, 67)
  result = await request(`/projects/${projectId}/tasks/${scenarioB.payload.data._id}`, { token: ownerToken, method: 'PATCH', body: { status: 'done' } })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/sprints/${sprintId}/metrics`, { token: ownerToken })
  assert.equal(result.payload.data.health, 'Completed', 'all-done sprint is marked completed')
  const emptySprint = await request(`/projects/${projectId}/sprints`, { token: ownerToken, method: 'POST', body: { name: 'Empty sprint', startDate: '2026-11-21', endDate: '2026-11-24' } })
  assert.equal(emptySprint.response.status, 201)
  result = await request(`/projects/${projectId}/sprints/${emptySprint.payload.data._id}/metrics`, { token: ownerToken })
  assert.equal(result.payload.data.totalTasks, 0, 'empty sprint metrics are supported')
  assert.equal(result.payload.data.health, 'At Risk', 'an empty sprint has no committed work to monitor')
  result = await request(`/projects/${projectId}/sprints/${emptySprint.payload.data._id}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/readiness`, { token: ownerToken })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.score, 20, 'the single completed core workflow check contributes one evidence point')
  result = await request(`/projects/${projectId}/sprints/${sprintId}/stories/${storyId}`, { token: ownerToken, method: 'PUT' })
  assert.equal(result.response.status, 409, 'duplicate story selection must be rejected')
  result = await request(`/projects/${projectId}/sprints/${sprintId}`, { token: ownerToken, method: 'PATCH', body: { status: 'active' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.status, 'active')
  result = await request(`/projects/${projectId}/sprints/${sprintId}`, { token: ownerToken, method: 'PATCH', body: { startDate: '2026-11-25', endDate: '2026-11-24' } })
  assert.equal(result.response.status, 400, 'sprint end date must follow start date')
  result = await request(`/projects/${projectId}/sprints`, { token: ownerToken })
  assert.equal(result.payload.data.length, 1)

  result = await request(`/projects/${projectId}/test-cases`, { token: ownerToken, method: 'POST', body: { title: 'MVP demo opens' , testType: 'manual', expectedResult: 'Main screen is visible' } })
  assert.equal(result.response.status, 201)
  const testCaseId = result.payload.data._id
  result = await request(`/projects/${projectId}/test-cases/${testCaseId}`, { token: ownerToken, method: 'PATCH', body: { status: 'passed', actualResult: 'Main screen is visible' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.status, 'passed')
  result = await request(`/projects/${projectId}/test-cases/${testCaseId}`, { token: ownerToken, method: 'PATCH', body: { category: 'demo' } })
  assert.equal(result.payload.data.category, 'demo', 'readiness evidence category is persisted')
  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Demo feature complete', sprintId, status: 'done', readinessArea: 'demo', storyPoints: 0 } })
  assert.equal(result.response.status, 201)
  result = await request(`/projects/${projectId}/test-cases`, { token: ownerToken, method: 'POST', body: { title: 'Reject malformed email', category: 'input_validation', status: 'passed', input: 'invalid email', expectedResult: 'Validation error', actualResult: 'Validation error' } })
  assert.equal(result.response.status, 201)
  for (const title of ['Test case 3', 'Test case 4', 'Test case 5']) {
    result = await request(`/projects/${projectId}/test-cases`, { token: ownerToken, method: 'POST', body: { title } })
    assert.equal(result.response.status, 201)
  }
  result = await request(`/projects/${projectId}/readiness`, { token: ownerToken })
  assert.equal(result.payload.data.score, 80, 'readiness awards points only for qualifying project evidence')
  assert.equal(result.payload.data.checks.find(check => check.id === 'critical_tasks').passed, false, 'missing critical task evidence remains a failed check')
  result = await request(`/projects/${projectId}/test-cases/${testCaseId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)

  result = await request(`/projects/${projectId}/members`, { token: ownerToken, method: 'POST', body: { email: `member-${suffix}@agileforge.test`, role: 'admin', capacityPoints: 32 } })
  assert.equal(result.response.status, 201, result.payload.message)
  const memberProjectUserId = result.payload.data.userId._id
  assert.equal(result.payload.data.capacityPoints, 32)
  assert.equal(result.payload.data.role, 'admin')
  result = await request(`/projects/${projectId}/members/${memberProjectUserId}`, { token: ownerToken, method: 'PATCH', body: { role: 'member', capacityPoints: 24 } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.capacityPoints, 24)
  assert.equal(result.payload.data.role, 'member')
  result = await request(`/projects/${projectId}/members`, { token: ownerToken })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.length, 2)
  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'Invalid teammate assignment', storyPoints: 1, assignedTo: '000000000000000000000001' } })
  assert.equal(result.response.status, 400, 'stories cannot be assigned outside the project team')

  result = await request(`/projects/${projectId}/members/${memberProjectUserId}`, { token: ownerToken, method: 'PATCH', body: { capacityPoints: 10 } })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'Eight point story', storyPoints: 8, assignedTo: memberProjectUserId } })
  assert.equal(result.response.status, 201)
  const eightPointStoryId = result.payload.data._id
  result = await request(`/projects/${projectId}/sprints/${sprintId}/stories/${eightPointStoryId}`, { token: ownerToken, method: 'PUT' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'Over capacity candidate', storyPoints: 5, assignedTo: memberProjectUserId } })
  assert.equal(result.response.status, 201)
  const overCapacityStoryId = result.payload.data._id
  result = await request(`/projects/${projectId}/sprints/${sprintId}/stories/${overCapacityStoryId}`, { token: ownerToken, method: 'PUT' })
  assert.equal(result.response.status, 409, 'adding preassigned work must validate sprint capacity')
  assert.equal(result.payload.details.code, 'CAPACITY_EXCEEDED')
  result = await request(`/projects/${projectId}/stories/${overCapacityStoryId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/stories`, { token: ownerToken, method: 'POST', body: { title: 'Five point story', storyPoints: 5 } })
  assert.equal(result.response.status, 201)
  const fivePointStoryId = result.payload.data._id
  const fivePointStoryKey = result.payload.data.storyKey
  result = await request(`/projects/${projectId}/sprints/${sprintId}/stories/${fivePointStoryId}`, { token: ownerToken, method: 'PUT' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/sprints/${sprintId}/metrics`, { token: ownerToken })
  assert.equal(result.payload.data.members.find(member => member.userId === memberProjectUserId).assignedPoints, 8)
  assert.equal(result.payload.data.members.find(member => member.userId === memberProjectUserId).capacityPoints, 10)
  result = await request(`/projects/${projectId}/stories/${fivePointStoryId}`, { token: ownerToken, method: 'PATCH', body: { assignedTo: memberProjectUserId } })
  assert.equal(result.response.status, 409, `capacity overflow should be rejected: ${JSON.stringify(result.payload)}`)
  assert.equal(result.payload.details.code, 'CAPACITY_EXCEEDED')
  assert.equal(result.payload.details.remainingPoints, 2)
  result = await request(`/projects/${projectId}/stories/${eightPointStoryId}`, { token: ownerToken, method: 'PATCH', body: { assignedTo: ownerId } })
  assert.equal(result.response.status, 200, 'work can be redistributed to another member')
  result = await request(`/projects/${projectId}/stories/${fivePointStoryId}`, { token: ownerToken, method: 'PATCH', body: { assignedTo: memberProjectUserId } })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/sprints/${sprintId}/metrics`, { token: ownerToken })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.durationDays, 3)
  assert.equal(result.payload.data.totalStoryPoints, 16)
  assert.equal(result.payload.data.members.find(member => member.userId === memberProjectUserId).assignedPoints, 5)
  assert.equal(result.payload.data.members.find(member => member.userId === memberProjectUserId).remainingCapacity, 5)
  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Build a launch endpoint', sprintId, assignedTo: memberProjectUserId, storyPoints: 5 } })
  assert.equal(result.response.status, 201, result.payload.message)
  const sprintTaskId = result.payload.data._id
  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Add another endpoint', sprintId, assignedTo: memberProjectUserId, storyPoints: 1 } })
  assert.equal(result.response.status, 409, 'sprint task assignment must enforce member capacity')
  assert.equal(result.payload.details.code, 'CAPACITY_EXCEEDED')
  result = await request(`/projects/${projectId}/tasks/${sprintTaskId}`, { token: ownerToken, method: 'PATCH', body: { assignedTo: ownerId } })
  assert.equal(result.response.status, 200, 'tasks can be redistributed to another member')
  result = await request(`/projects/${projectId}/tasks`, { token: ownerToken, method: 'POST', body: { title: 'Assign outside project', sprintId, assignedTo: '000000000000000000000001', storyPoints: 1 } })
  assert.equal(result.response.status, 400, 'tasks cannot be assigned to non-team members')
  result = await request(`/projects/${projectId}/stories/${fivePointStoryId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/stories?q=${fivePointStoryKey}`, { token: ownerToken })
  assert.equal(result.payload.data.length, 0, 'deleted stories should leave the backlog')
  result = await request(`/projects/${projectId}/sprints/${sprintId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/sprints`, { token: ownerToken })
  assert.equal(result.payload.data.length, 0)

  result = await request(`/projects/${projectId}`, { token: memberToken })
  assert.equal(result.response.status, 200, 'a listed team member can view project details')
  result = await request(`/projects/${projectId}`, { token: memberToken, method: 'PATCH', body: { name: 'Unauthorized edit' } })
  assert.equal(result.response.status, 403, 'regular members cannot edit project details')

  result = await request(`/projects/${projectId}/members/${memberProjectUserId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}/members`, { token: ownerToken })
  assert.equal(result.payload.data.length, 1)
  const manualEmail = `manual-${suffix}@agileforge.test`
  result = await request(`/projects/${projectId}/members/manual`, { token: ownerToken, method: 'POST', body: { name: 'Manual Teammate', email: manualEmail, role: 'member', capacityPoints: 7 } })
  assert.equal(result.response.status, 201, result.payload.message)
  assert.equal(result.payload.data.member.userId.email, manualEmail)
  assert.equal(result.payload.data.member.capacityPoints, 7)
  assert.ok(result.payload.data.temporaryPassword)
  result = await request('/auth/login', { method: 'POST', body: { email: manualEmail, password: result.payload.data.temporaryPassword } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.user.mustChangePassword, true)
  const manualToken = result.payload.data.token
  result = await request('/auth/me', { token: manualToken, method: 'PATCH', body: { password: 'changed-password-123' } })
  assert.equal(result.response.status, 200)
  assert.equal(result.payload.data.user.mustChangePassword, false)
  result = await request('/auth/login', { method: 'POST', body: { email: manualEmail, password: 'changed-password-123' } })
  assert.equal(result.response.status, 200, 'manually created member can replace the one-time password')
  result = await request(`/projects/${projectId}/members/manual`, { token: ownerToken, method: 'POST', body: { name: 'Duplicate Teammate', email: manualEmail } })
  assert.equal(result.response.status, 409, 'manual creation must reject duplicate accounts')

  const evidenceProject = await request('/projects', { token: ownerToken, method: 'POST', body: { name: 'AgileForge QA Evidence', description: 'Persisted execution records from the automated integration suite.' } })
  assert.equal(evidenceProject.response.status, 201)
  const formalCases = [
    ['AF-QA-001','Registration and login','Positive','Valid unique account; register, then login with correct password.','Registration and login return 201/200 with a JWT.','Both returned expected success status and JWT.'],
    ['AF-QA-002','Empty and malformed registration','Negative','Submit empty registration and an invalid email.','Both requests return 400 with validation errors.','Both returned 400; duplicate email also returned 409 in the duplicate-registration assertion.'],
    ['AF-QA-003','Project creation and editing','Positive','Create a named project; edit its name and description.','Project is persisted and returns updated fields.','Create returned 201; patch returned 200 with edited name and description.'],
    ['AF-QA-004','Team membership and capacity configuration','Positive','Invite a registered user; set role and capacity; update; remove.','Membership, role, capacity and removal persist.','Member add/update/list/remove assertions passed with the expected role and capacity values.'],
    ['AF-QA-005','Backlog story CRUD and validation','Positive','Create, search, filter, edit and delete stories; submit invalid estimate.','CRUD and filters work; invalid Fibonacci estimate returns 400.','CRUD/search/filter assertions passed; invalid estimate returned 400.'],
    ['AF-QA-006','Sprint date and duplicate-story boundaries','Boundary','Create a valid sprint; select one story twice; submit reversed dates.','Valid sprint persists; duplicate selection returns 409; reversed dates return 400.','Create returned 201; duplicate returned 409; invalid date update returned 400.'],
    ['AF-QA-007','Capacity overflow and redistribution','Boundary','Member capacity 10; assign 8 points; attempt another 5; redistribute.','Overflow returns 409 with CAPACITY_EXCEEDED; redistribution succeeds.','8-point work fit; 5-point overflow was rejected with 409 and remainingPoints 2; redistribution succeeded.'],
    ['AF-QA-008','Kanban status history','Positive','Move task from todo to done.','MongoDB task stores previousStatus, new status and timestamp.','Task PATCH succeeded; latest history entry recorded todo → done with changedAt.'],
    ['AF-QA-009','Sprint analytics scenarios','Boundary','Evaluate all-pending, partial, overdue, all-done and empty sprints.','Counts, completion percentage, overdue count and health recalculate.','Assertions passed for 2 pending/1 overdue/Delayed, 67% partial completion, Completed all-done, and empty At Risk.'],
    ['AF-QA-010','MVP readiness evidence scoring','Positive','Record completed core work, passing validation/demo evidence, and five test cases.','Only evidenced checks pass and score equals four of five checks.','Evaluation returned 80%; missing critical-task evidence remained failed.'],
    ['AF-QA-011','Invalid IDs and missing projects','Negative','Request malformed project ID and a well-formed nonexistent project ID.','Malformed ID returns 400; nonexistent record returns 404.','Both returned their expected status codes.'],
    ['AF-QA-012','Incorrect credentials and authorization','Negative','Login with wrong password; attempt protected route without token and manager edit as member.','Requests return 401/403 and do not grant access.','Wrong password/protected route returned 401; unauthorized member project edit returned 403.'],
    ['AF-QA-013','Manually create a teammate account','Positive','Create member by name/email, sign in with one-time password, set a new password.','Account joins project; one-time password works; forced reset clears.','Manual account returned 201 and member capacity 7; temporary login succeeded; password update cleared mustChangePassword; duplicate email returned 409.'],
  ]
  for (const [caseId, scenario, classification, input, expectedResult, actualResult] of formalCases) {
    const saved = await request(`/projects/${evidenceProject.payload.data._id}/test-cases`, { token: ownerToken, method: 'POST', body: { caseId, scenario, classification: classification.toLowerCase(), title: scenario, input, expectedResult, actualResult, status: 'passed' } })
    assert.equal(saved.response.status, 201, `persist formal case ${caseId}`)
    assert.equal(saved.payload.data.caseId, caseId)
    assert.equal(saved.payload.data.status, 'passed')
  }
  const savedEvidence = await request(`/projects/${evidenceProject.payload.data._id}/test-cases`, { token: ownerToken })
  assert.equal(savedEvidence.response.status, 200)
  assert.equal(savedEvidence.payload.data.length, formalCases.length, 'all executed formal cases persist in MongoDB')

  result = await request(`/projects/${projectId}`, { token: ownerToken, method: 'DELETE' })
  assert.equal(result.response.status, 200)
  result = await request(`/projects/${projectId}`, { token: ownerToken })
  assert.equal(result.response.status, 404, 'deleted projects should no longer be accessible')

  result = await request('/auth/me', { token: ownerToken })
  assert.equal(result.response.status, 200)
  result = await request('/auth/me', { token: ownerToken, method: 'PATCH', body: { name: 'Jordan Updated' } })
  assert.equal(result.response.status, 200, 'profile settings persist through the API')
  assert.equal(result.payload.data.user.name, 'Jordan Updated')
  result = await request('/auth/me', { token: ownerToken, method: 'PATCH', body: { avatarUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' } })
  assert.equal(result.response.status, 400, 'unsupported profile photo types should be rejected')
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/z3sAAAAASUVORK5CYII='
  result = await request('/auth/me', { token: ownerToken, method: 'PATCH', body: { avatarUrl: tinyPng } })
  assert.equal(result.response.status, 200, 'a valid profile photo can be saved')
  assert.equal(result.payload.data.user.avatarUrl, tinyPng)
  result = await request('/auth/logout', { token: ownerToken, method: 'POST' })
  assert.equal(result.response.status, 200)
  result = await request('/auth/me', { token: ownerToken })
  assert.equal(result.response.status, 401, 'logout invalidates the bearer token')
})
