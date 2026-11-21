# Installation

## Prerequisites

- Node.js 20+ and npm.
- MongoDB running locally or a MongoDB URI supplied by your deployment.
- Two terminals for the API and Vite development server.

## Environment

Copy `backend/.env.example` to `backend/.env`. Set:

- `MONGODB_URI` to the database URI (default example: `mongodb://127.0.0.1:27017/agileforge`).
- `JWT_SECRET` to a random secret string. Never commit `.env` or share production secrets.
- `PORT`, `CLIENT_URL`, and `JWT_EXPIRES_IN` as needed.
- Optionally set `MONGODB_SERVER_SELECTION_TIMEOUT_MS` to tune startup failure timeout (default 10 seconds).

Copy `frontend/.env.example` to `frontend/.env` when the API is not at `http://localhost:5000/api`; set `VITE_API_URL` to the API base URL.

## Install and run

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

In another terminal, from the repository root:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite address printed in the terminal, normally `http://localhost:5173`. The API health endpoint is `http://localhost:5000/api/health`.

## Production build and tests

```powershell
cd frontend
npm.cmd run build
npm.cmd run test:render
```

```powershell
cd backend
npm.cmd run test:integration
```

The test command needs MongoDB available at `127.0.0.1:27017`. It uses a timestamped `agileforge_qa_*` database and retains persisted formal QA records after completion. The test output prints the database name. The database connection failure test uses an unreachable local port and has a 250 ms selection timeout.
