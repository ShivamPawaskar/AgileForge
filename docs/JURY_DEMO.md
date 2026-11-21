# Jury demonstration guide

## Ten-minute sequence

1. **Problem (45 sec):** Hackathon teams have little time to agree on scope, divide work and notice delivery risk. Ad hoc boards hide capacity and evidence.
2. **AgileForge (45 sec):** Introduce a MongoDB-backed workspace connecting project context, stories, sprints, execution and a rule-based readiness check.
3. **Project creation (60 sec):** Register/sign in, open My Projects, create a project with a concise problem statement, deadline and stack. Point out the project is persisted.
4. **Backlog (60 sec):** Add a user story with acceptance criteria, priority, Fibonacci estimate and assignee. Search/filter, then edit it.
5. **Sprint planning (90 sec):** Create a sprint, set goal and dates, add the story, then create a task and assign it.
6. **Capacity validation (45 sec):** Show remaining capacity. Try an assignment that exceeds it; explain the explicit warning/409 response, then redistribute the work.
7. **Kanban (60 sec):** Drag a task from To Do to In Progress or Done. Show that the move persists, and that the status history captures previous status, next status and timestamp.
8. **Analytics (60 sec):** Open analytics and point out task counts, points, workload, burndown and rule-based health from the selected sprint's database records.
9. **MVP readiness (90 sec):** Add test evidence, tag a core-workflow/demo task, run Evaluate. Open a failed check and explain its missing evidence and recommendation. Do not present the score as AI or automated feature testing.
10. **Test and repository evidence (45 sec):** Run `npm.cmd run test:integration` in PowerShell, show the actual pass count, MongoDB database name and persisted test cases. Show [the AgileForge repository](https://github.com/ShivamPawaskar/AgileForge), and explain that its setup commits record publishing the current codebase, not historical sprint activity or individual feature attribution.

## Architecture explanation

The Vite React SPA calls the Express REST API through Axios. JWT middleware identifies the account. Controllers validate requests and references; project and capacity services enforce access and workload rules. Mongoose models persist users, projects, members, stories, sprints, tasks and test cases in MongoDB. The frontend reloads database results after writes.

## Database explanation

`ProjectMember` joins users to projects with a role and story-point capacity. Stories and tasks refer to a project; sprint tasks refer to a sprint and optional story. `Task.statusHistory` is an append-only transition list with previous/new status, actor and time. `TestCase` holds input, expected and actual results plus classification/readiness category.

## Business logic explanation

- A story/task assignment checks the member's sprint load against `capacityPoints`. Overflow returns a 409 with assigned, requested, remaining and capacity detail.
- Sprint metrics are computed on request from task/sprint records. Task points drive completion; overdue means unfinished with due date before evaluation.
- Health is rule-based: Completed when work is complete or the sprint is explicitly complete; Delayed when pace is more than 20 points behind elapsed time or overdue work exists after halfway; At Risk for more than 10 points behind, overdue earlier in sprint, or no tasks; otherwise On Track.
- Readiness is five equal evidence checks: completed tagged core workflow, all recorded critical tasks done (with at least one), passed input-validation test, five recorded test cases, and a completed tagged demo task plus passed demo test. Score is passing checks divided by five.

## Contribution statement

The application is published at [github.com/ShivamPawaskar/AgileForge](https://github.com/ShivamPawaskar/AgileForge). The current setup commits do not establish historical contributor attribution. Do not claim specific individual ownership based only on the current files. A presenter can accurately describe their own verified contribution in first person, for example: “I worked on [the parts I personally implemented], and I verified [commands/results].” Fill the brackets from actual team records before presenting.

## Challenges and solutions visible in the implementation

- **Capacity conflicts:** server-side checks protect against stale clients; the UI explains overload and supports reassignment.
- **Stale dashboard numbers:** metrics are recalculated from saved records and pages refetch after task moves.
- **Trustworthy readiness:** explicit evidence categories and open failed checks replace unsupported percentage claims.
- **Workflow errors:** centralized error responses and status history make invalid requests and task movement inspectable.

## 48-hour build: deferred scope

No timeline or work log is present, so these are current omissions rather than verified historical decisions: GitHub remote/CI/deployment; browser E2E; recent-activity event feed; report export; outbound notifications/integrations; immutable burndown snapshots; route-level bundle splitting; broader permissions/settings. Do not describe them as features that were historically planned unless project records confirm that.
