# AgileForge

AgileForge is a full-stack planning and execution workspace for hackathon teams. It stores projects, teammates, backlog stories, sprints, tasks, status history and test evidence in MongoDB. Sprint analytics and readiness checks are calculated from those records.

## Features implemented

- JWT registration, login, profile updates and logout; passwords are hashed with bcrypt.
- Project CRUD, membership roles and member capacity; add registered teammates or create a teammate account directly with a one-time password that must be changed at first sign-in.
- Product backlog story CRUD, search, filtering, acceptance criteria and Fibonacci story points.
- Sprint setup, selected stories, task assignment and server-side capacity validation.
- Kanban board with `@dnd-kit` drag and drop, task CRUD, filters and recorded status transitions.
- Database-derived sprint counts, burndown, workload, progress and rule-based sprint health.
- Evidence-based MVP readiness checks and project test case CRUD.
- Responsive dark navy and purple dashboard UI.

## Requirements

- Node.js 20 or later (verified with Node 24.22.1).
- npm.
- MongoDB Community Server or a MongoDB-compatible deployment. This app uses MongoDB through Mongoose; MongoDB is required.

## Quick start

1. Start MongoDB and verify it is accepting connections.
2. Copy `backend/.env.example` to `backend/.env`; set a private, long `JWT_SECRET` and the correct `MONGODB_URI`.
3. Copy `frontend/.env.example` to `frontend/.env` if you need a non-default API URL.
4. In one PowerShell terminal, run `cd backend`, `npm.cmd install`, then `npm.cmd run dev`.
5. In a second terminal, run `cd frontend`, `npm.cmd install`, then `npm.cmd run dev`.
6. Open the Vite URL (normally `http://localhost:5173`), register an account and create a project.

For full details see [Installation](docs/INSTALLATION.md), [Technology stack](docs/TECHNOLOGY.md), [Architecture](docs/ARCHITECTURE.md), [MongoDB schema](docs/MONGODB_SCHEMA.md), [API reference](docs/API.md), [Features and limitations](docs/FEATURES_AND_LIMITATIONS.md), and [Jury demonstration guide](docs/JURY_DEMO.md).

For deployment, see [Deployment](docs/DEPLOYMENT.md). The root `vercel.json` configures the React/Vite frontend and Express API as one Vercel multi-service project; `render.yaml` is also available for a separate Render API deployment.

## Verification

With local MongoDB available, run `cd backend` then `npm.cmd run test:integration` in PowerShell. The suite exercises REST flows and saves 13 formal executed test cases in a dedicated database named `agileforge_qa_<timestamp>`. The test output prints the exact database name. These QA records are kept separate from a normal `agileforge` development database.

Run `cd frontend` then `npm.cmd run build` to verify the production bundle.
Run `npm.cmd run test:render` from `frontend` to smoke-test initial React rendering (this is not browser-driven E2E).

## Current scope and limitations

- The sprint burndown is reconstructed from task creation dates and persisted status history. Historical scope edits are not versioned.
- Recent activity timelines, notifications, project settings beyond the profile, and export/report downloads are not implemented as persisted features.
- MVP readiness is a transparent rule-based checklist. It is not predictive AI and cannot prove a feature works beyond the recorded task and test evidence.
- The current application is published at [github.com/ShivamPawaskar/AgileForge](https://github.com/ShivamPawaskar/AgileForge). The repository setup commits record publication of the current codebase; they do not represent historical sprint activity or establish individual feature attribution.
- Automated verification covers backend integration and frontend production compilation. No browser-driven UI automation suite is currently included.

## Documentation map

- [Test cases and results](docs/TEST_CASES.md)
- [48-hour build retrospective and jury talking points](docs/JURY_DEMO.md)
- [Definition of Done and Agile evidence](docs/AGILE_EVIDENCE.md)
