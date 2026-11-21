# Technology stack

## Frontend

- React 18 and Vite 5 for the SPA and development/build tooling.
- React Router 6 for page navigation.
- Tailwind CSS is configured; the current dashboard primarily uses shared project CSS for its detailed design system.
- Axios for API calls and bearer token authorization.
- Recharts for live sprint charts.
- Lucide React for icons, Framer Motion for page transitions.
- `@dnd-kit/core`, sortable and utilities for Kanban drag and drop.

## Backend and persistence

- Node.js with Express 4 REST endpoints.
- MongoDB and Mongoose 8 for persisted records and schema validation.
- JWT authentication and bcrypt password hashing.
- dotenv for environment configuration.

## Verification

- Node built-in test runner for API integration and database connection failure scenarios.
- Vite production build for frontend compilation.

## Runtime boundaries

The browser talks to the Express API. The API authenticates requests, validates records, enforces project access and capacity, then reads/writes MongoDB. There is no localStorage-backed project, task, or team persistence. The JWT is held in sessionStorage for the browser session.
