import Task from '../models/Task.js'
import TestCase from '../models/TestCase.js'
import * as projects from '../services/projectService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const evaluate = asyncHandler(async (req, res) => {
  await projects.accessibleProject(req.params.projectId, req.user.id)
  const [tasks, testCases] = await Promise.all([
    Task.find({ projectId: req.params.projectId }),
    TestCase.find({ projectId: req.params.projectId }).sort({ createdAt: -1 }),
  ])
  const core = tasks.filter(task => task.readinessArea === 'core_workflow')
  const critical = tasks.filter(task => task.priority === 'critical')
  const validationEvidence = testCases.filter(test => test.category === 'input_validation' && test.status === 'passed')
  const demoTasks = tasks.filter(task => task.readinessArea === 'demo' && task.status === 'done')
  const demoEvidence = testCases.filter(test => test.category === 'demo' && test.status === 'passed')
  const checks = [
    { id: 'core_workflow', title: 'Core workflow completion', passed: core.length > 0 && core.every(task => task.status === 'done'), evidence: core.length ? `${core.filter(task => task.status === 'done').length} of ${core.length} tagged core workflow tasks are done.` : 'No tasks are tagged as core workflow.', recommendation: 'Tag the primary user journey tasks as Core workflow, then complete them.' },
    { id: 'critical_tasks', title: 'Critical task completion', passed: critical.length > 0 && critical.every(task => task.status === 'done'), evidence: critical.length ? `${critical.filter(task => task.status === 'done').length} of ${critical.length} critical tasks are done.` : 'No critical tasks have been recorded.', recommendation: 'Record critical tasks and finish every one before the demo.' },
    { id: 'input_validation', title: 'Input validation evidence', passed: validationEvidence.length > 0, evidence: validationEvidence.length ? `${validationEvidence.length} passing input validation test case(s).` : 'No passing test case is categorized as input validation.', recommendation: 'Record and pass a test case that exercises invalid and valid input.' },
    { id: 'test_coverage', title: 'At least five recorded test cases', passed: testCases.length >= 5, evidence: `${testCases.length} test case(s) recorded.`, recommendation: `Add ${Math.max(0, 5 - testCases.length)} more test case(s) and record their outcomes.` },
    { id: 'working_demo', title: 'Working demonstration feature', passed: demoTasks.length > 0 && demoEvidence.length > 0, evidence: `${demoTasks.length} completed demo task(s), ${demoEvidence.length} passing demo test(s).`, recommendation: 'Complete a task tagged Demo feature and record a passing demo test case.' },
  ]
  const passed = checks.filter(check => check.passed).length
  res.json({ success: true, data: { score: Math.round(passed / checks.length * 100), passedChecks: passed, totalChecks: checks.length, checks, evaluatedAt: new Date(), testCases } })
})
