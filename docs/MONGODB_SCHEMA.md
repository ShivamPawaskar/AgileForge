# MongoDB schema

The application uses Mongoose collections. ObjectId references are scoped to their project in controller checks where applicable.

| Model | Main fields and relationships |
|---|---|
| `User` | name, unique email, passwordHash, role, mustChangePassword, timestamps |
| `Project` | name, description, problemStatement, technologyStack, owner → User, teamMembers → User, startDate, deadline, status |
| `ProjectMember` | projectId → Project, userId → User, role, capacityPoints; unique project/user pair |
| `UserStory` | projectId, generated storyKey, title, description, acceptanceCriteria, priority, Fibonacci storyPoints, assignedTo, status |
| `Sprint` | projectId, name, sprintGoal, startDate, endDate, selectedStories → UserStory, status |
| `Task` | projectId, sprintId, userStoryId, title, description, assignedTo, priority, storyPoints, status, dueDate, readinessArea, statusHistory |
| `TestCase` | projectId, title, caseId/scenario/classification, testType, readiness category, input, expectedResult, actualResult, status |

All models use timestamps unless noted. Task history contains the old and new state, actor and timestamp. Project membership capacity is in story points. Task estimates permit nonnegative numeric values; story estimates use the listed Fibonacci sequence through 34.

The formal integration run persists its 13 records to `TestCase` documents inside a QA-only project and timestamped QA database. This avoids mixing generated QA data into a regular development database.
