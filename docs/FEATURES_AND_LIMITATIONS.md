# Features implemented and known limitations

## Implemented

- Account registration/login, password hashing, JWT-protected APIs and profile edits.
- Project and team CRUD with roles and capacity settings.
- Manual teammate account creation with a one-time password and forced password change at first sign-in; no email delivery is configured, so the project manager shares it directly.
- User story backlog CRUD with generated project IDs, search, priority/status filters and acceptance criteria.
- Sprint creation, story selection, assignments and workload/capacity validation on client and server.
- Task create/edit/delete, assignment, priority, estimates, due dates and evidence tags.
- Four-column Kanban with `@dnd-kit` moves and persisted status audit history.
- MongoDB-derived analytics charts, task counts, workload, overdue count, burndown and sprint health.
- MVP readiness evaluation with inspectable failed checks and project test case management.
- Responsive dashboard styles, empty/loading/error states on core data pages, and request feedback.

## Known limitations

- No browser automation suite is included. API integration and production compilation are verified; visual interaction should also be manually checked in a browser before a public demo.
- The application is published at [github.com/ShivamPawaskar/AgileForge](https://github.com/ShivamPawaskar/AgileForge). CI and deployment evidence are not configured. The initial repository commits document publication and should not be presented as historical sprint activity or individual contribution evidence.
- Project recent-activity feed, report export, notification settings, integrations and most workspace preferences are deferred. Profile settings are persisted.
- Burndown reconstructs from current task estimates and status history; deleted tasks and historical estimate/scope edits are not retained as snapshots.
- Readiness depends on user-entered categories and test outcomes. It does not independently execute application tests or inspect code.
- JWT is stored in sessionStorage; production deployment should add an explicit token/session threat review and suitable transport/security headers.
- The frontend build currently emits a large JavaScript chunk warning (about 907 KB minified); route-level code splitting is a future optimization.

## Future enhancements

- Browser-level E2E testing and CI pipeline.
- Immutable project activity events and historical sprint scope snapshots.
- Exportable sprint reports, notification delivery and integrations.
- Fine-grained permissions for editing tasks, stories and test evidence.
- Route-level code splitting and production deployment hardening.
