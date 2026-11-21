# Formal test cases and execution results

The backend integration suite executes REST calls and assertions, then stores the following 13 formal records as `TestCase` documents in a QA-only project. A record is marked `passed` only after the matching scenario assertions pass. The exact timestamped database name is printed by `npm.cmd run test:integration`.

| ID | Class | Scenario | Input | Expected result | Actual result | Status |
|---|---|---|---|---|---|---|
| AF-QA-001 | Positive | Registration and login | Register unique email, login correct password | Registration/login succeed and return JWT | Returned 201/200 and JWT | Passed |
| AF-QA-002 | Negative | Empty and malformed registration | Empty body and malformed email | Validation returns 400; duplicate returns 409 | All returned expected validation/duplicate statuses | Passed |
| AF-QA-003 | Positive | Project create/edit | Create project then patch name and description | Saved fields reflect update | Create 201, patch 200 with updated values | Passed |
| AF-QA-004 | Positive | Team membership and capacity | Add member, change role/capacity, remove | Membership fields persist and removal succeeds | Add/update/list/remove assertions passed | Passed |
| AF-QA-005 | Positive | Backlog CRUD and validation | Create, search, filter, edit, delete stories; invalid estimate | CRUD works and invalid estimate is rejected | CRUD/search/filter passed; invalid estimate 400 | Passed |
| AF-QA-006 | Boundary | Sprint dates and duplicate selection | Valid sprint, duplicate story, reversed dates | Duplicate 409; invalid date 400 | All expected status assertions passed | Passed |
| AF-QA-007 | Boundary | Capacity overflow and redistribution | Capacity 10, assigned 8, attempt 5, redistribute | Overflow 409 with capacity detail; reassignment succeeds | 5-point overflow rejected; remaining 2; redistribution succeeded | Passed |
| AF-QA-008 | Positive | Kanban status history | Move `todo` task to `done` | Persist old/new state and timestamp | History assertion recorded `todo` → `done` and `changedAt` | Passed |
| AF-QA-009 | Boundary | Sprint analytics scenarios | All pending, partial, overdue, all done, no tasks | Recomputed counts, health and completion | 2 pending/1 overdue/Delayed; 67% partial; Completed; empty At Risk | Passed |
| AF-QA-010 | Positive | MVP readiness evidence | Core workflow, demo task/test, input validation test, five test cases | Evidence-backed score and failed missing check | 80%; critical-task check correctly failed | Passed |
| AF-QA-011 | Negative | Invalid ID and missing project | Malformed ID and valid nonexistent ID | 400 and 404 | Both expected statuses returned | Passed |
| AF-QA-012 | Negative | Credentials and authorization | Wrong password, unauthenticated request, member edit | 401/403; no unauthorized access | Expected 401/403 assertions passed | Passed |
| AF-QA-013 | Positive | Manually create a teammate | Name, new email, role and capacity; login with temporary password and change it | Account joins project and is forced to change its one-time password | Creation/login/password reset succeeded; duplicate email returned 409 | Passed |

## Exceptional case

The separate `databaseFailure.test.js` test connects to `127.0.0.1:1` with a short selection timeout and asserts that connection failure rejects through the MongoDB error path. It is an automated test result and does not get stored as a project `TestCase`, because no MongoDB connection exists in that scenario.

## Run and inspect

```powershell
cd backend
npm.cmd run test:integration
```

The test runner reports the number of passing automated tests and logs `MongoDB QA records retained in database: agileforge_qa_<timestamp>`. Inspect the corresponding database's `testcases` collection in MongoDB Compass or `mongosh`. The records are linked to an `AgileForge QA Evidence` project in that same isolated database.

The API test suite does not drive a real browser. A successful backend test run does not verify rendering, drag pointer behavior or every responsive breakpoint.
