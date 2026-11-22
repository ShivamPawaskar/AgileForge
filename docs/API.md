# API reference

Base URL: `http://localhost:5000/api`. All `/projects` routes require `Authorization: Bearer <JWT>`. JSON errors use `{ "success": false, "message": "..." }` and may include `details`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | API process health |
| GET | `/health/database` | MongoDB connection health |

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account, hash password, issue JWT |
| POST | `/auth/login` | Verify credentials and issue JWT |
| GET | `/auth/me` | Read current profile |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/logout` | Revoke token |

## Projects, team and work

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/projects` | List accessible projects / create |
| GET/PATCH/DELETE | `/projects/:projectId` | Read, edit or remove project |
| GET/POST | `/projects/:projectId/members` | List / add member |
| POST | `/projects/:projectId/members/manual` | Create an account and membership; returns a one-time password that must be changed at first sign-in |
| PATCH/DELETE | `/projects/:projectId/members/:userId` | Change role/capacity / remove |
| GET/POST | `/projects/:projectId/stories` | List/filter/search / create story |
| PATCH/DELETE | `/projects/:projectId/stories/:storyId` | Edit / remove story |
| GET/POST | `/projects/:projectId/sprints` | List / create sprint |
| PATCH/DELETE | `/projects/:projectId/sprints/:sprintId` | Edit / remove sprint |
| PUT/DELETE | `/projects/:projectId/sprints/:sprintId/stories/:storyId` | Add / remove selected story |
| GET | `/projects/:projectId/sprints/:sprintId/metrics` | Live counts, workload, burndown, health and progress |
| GET/POST | `/projects/:projectId/tasks` | List (optional `sprintId`, `status`) / create |
| PATCH/DELETE | `/projects/:projectId/tasks/:taskId` | Edit/status transition / remove |
| GET | `/projects/:projectId/readiness` | Evaluate project evidence and score |
| GET/POST | `/projects/:projectId/test-cases` | List / record tests and evidence |
| PATCH/DELETE | `/projects/:projectId/test-cases/:testCaseId` | Edit / remove test case |
| GET | `/health` | API process health |

Common failures: 400 for invalid input/ObjectId, 401 for missing/invalid authentication, 403 for denied project action, 404 for missing records, 409 for duplicates or capacity overflow, and 500 for unexpected failures.
