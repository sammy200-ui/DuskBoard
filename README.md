# DuskBoard

DuskBoard is a workflow-driven project management system for software teams. It combines a Kanban-style frontend with backend-enforced workflow rules, project-scoped RBAC, and audit logging so task movement and team permissions are controlled by policy, not just UI behavior.

## What The Project Delivers

- Project-scoped collaboration with roles: `ADMIN`, `PM`, `DEVELOPER`, `QA`, `VIEWER`.
- Workflow enforcement in the backend through explicit transition rules.
- Sprint planning and execution with start/complete actions and rollover behavior.
- Task activity tracking through structured audit logs.
- Dashboard + project board + sprint management + project settings screens.

## Tech Stack

| Area | Stack |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, dnd-kit, Zustand |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Data | MongoDB with Mongoose |
| Auth | JWT access/refresh token flow |

## Repository Layout

```text
DuskBoard/
├── backend/
│   └── src/
│       ├── core/          # Workflow engine, RBAC, audit observer
│       ├── middlewares/   # Auth, permission, logging, error handling
│       ├── models/        # Mongoose models
│       └── modules/       # auth, users, projects, sprints, tasks
├── frontend/
│   ├── app/               # App Router pages
│   ├── components/        # UI + board + audit components
│   └── lib/               # API client and auth store
└── *.md                   # Product notes and design diagrams
```

## Core Domain Rules

### Roles

Project roles are assigned per project membership (not globally on the user):

- `ADMIN`
- `PM`
- `DEVELOPER`
- `QA`
- `VIEWER`

### Task Statuses

- `OPEN`
- `IN_PROGRESS`
- `CODE_REVIEW`
- `QA`
- `DONE`
- `BLOCKED`

### Workflow Transitions

Configured backend transitions:

- `OPEN -> IN_PROGRESS`
- `IN_PROGRESS -> CODE_REVIEW`
- `IN_PROGRESS -> BLOCKED`
- `CODE_REVIEW -> QA`
- `CODE_REVIEW -> IN_PROGRESS`
- `QA -> DONE`
- `QA -> IN_PROGRESS`
- `BLOCKED -> IN_PROGRESS`

The backend is the final authority for transitions. The frontend also requests valid transitions per task to improve UX and prevent invalid drag targets.

## API Overview

Base URL (local): `http://localhost:4000/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### User Profile

- `GET /users/me`
- `PUT /users/me`

### Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`

### Project Members

- `GET /projects/:id/members`
- `POST /projects/:id/members`
- `PUT /projects/:id/members/:userId`
- `DELETE /projects/:id/members/:userId`

### Sprints

- `GET /projects/:projectId/sprints`
- `POST /projects/:projectId/sprints`
- `PUT /projects/:projectId/sprints/:id`
- `PATCH /projects/:projectId/sprints/:id/start`
- `PATCH /projects/:projectId/sprints/:id/complete`
- `GET /projects/:projectId/sprints/:id/tasks`
- `POST /projects/:projectId/sprints/:id/tasks/:taskId`
- `DELETE /projects/:projectId/sprints/:id/tasks/:taskId`

### Tasks

- `GET /projects/:projectId/tasks`
- `POST /projects/:projectId/tasks`
- `GET /projects/:projectId/tasks/:id`
- `PUT /projects/:projectId/tasks/:id`
- `DELETE /projects/:projectId/tasks/:id`
- `PATCH /projects/:projectId/tasks/:id/status`
- `PUT /projects/:projectId/tasks/:id/assign`
- `GET /projects/:projectId/tasks/:id/audit`
- `GET /projects/:projectId/tasks/:id/valid-transitions`

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A running MongoDB instance

### 1) Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure Environment

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/duskboard

JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### 3) Run In Development

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Build And Quality Checks

Backend build:

```bash
cd backend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
cd frontend
npm run build
```

If your environment has native SWC/Turbopack issues (seen on some macOS setups), use:

```bash
npx next build --webpack
```

## Design Notes

The markdown diagrams in this repository were created early during planning. They still communicate intent well, but implementation has evolved.

- [idea.md](./idea.md)
- [useCaseDiagram.md](./useCaseDiagram.md)
- [sequenceDiagram.md](./sequenceDiagram.md)
- [classDiagram.md](./classDiagram.md)
- [ErDiagram.md](./ErDiagram.md)

For implementation truth, prefer the backend models, workflow engine, and route modules.

