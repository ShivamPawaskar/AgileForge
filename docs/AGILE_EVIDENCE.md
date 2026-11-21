# Agile evidence and Definition of Done

## Current product backlog themes

- **Authentication:** users can register, log in, update their profile and sign out.
- **Project workspace:** project owners can create/edit projects and manage members, roles and capacity.
- **Product backlog:** teams can create, search, filter, assign, estimate and edit user stories with acceptance criteria.
- **Sprint planning:** managers can create dated sprints, select stories and assign work while capacity checks prevent silent overload.
- **Execution:** teams can move tasks through To Do, In Progress, Review and Done; history is persisted.
- **Visibility:** live sprint analytics show counts, points, workload, burndown and rule-based health.
- **Readiness:** project task/test records feed a transparent MVP readiness checklist.

## Acceptance criteria examples

- A story cannot be assigned to a user outside the project's team.
- A duplicate story selection in a sprint is rejected.
- Assignment beyond remaining capacity returns a useful capacity error and can be redistributed.
- A status change writes old state, new state, actor and time to MongoDB.
- Analytics reflect persisted task changes after a fresh request.
- A readiness check passes only when its specified project evidence exists.

## Definition of Done

1. UI state is connected to an API endpoint and MongoDB record for completed data features.
2. Required fields, IDs, project ownership and capacity are validated server-side.
3. Errors are surfaced with a useful message; loading and empty states are present on the primary data pages.
4. API integration scenarios cover the positive path and relevant invalid/boundary path.
5. Frontend production build succeeds.
6. Documentation states what is verified and what remains limited.

## Task allocation and progress evidence

The application is published at [github.com/ShivamPawaskar/AgileForge](https://github.com/ShivamPawaskar/AgileForge). Its initial README and application upload commits record repository publication only; they do not document earlier sprint activity. No authored sprint events are available. Do not infer who wrote a feature or fabricate historical task allocation. The codebase contains implemented backlog, sprint, task and readiness records, and the QA run produces its own timestamped test evidence; these are current artifacts, not proof of historical 48-hour work allocation.
