# OpenSprint

Next.js 16 + React 19 + Tailwind CSS 4 + Drizzle ORM + PostgreSQL

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # biome lint
npm run format       # biome format --write
npm run check        # biome check --write

# Database (requires docker)
npm run db:up        # docker compose up -d
npm run db:down      # docker compose down
npm run db:clean    # docker compose down -v
npm run db:generate # drizzle-kit generate
npm run db:migrate  # drizzle-kit migrate
```

## Requirements

- **DATABASE_URL** must be set (checked by drizzle.config.ts)
- **Docker** must be running for database operations

## Architecture

- **Web Framework**: Hono (edge-first HTTP framework)
- **Database**: Drizzle ORM + PostgreSQL
- **Auth**: better-auth (src/server/lib/auth)
- **Data Models**:
  - `src/server/db/schemas/auth/` - User, Account, Session, Verification
  - `src/server/db/schemas/business/` - Project, ProjectMember, Board, Task

### Feature Routes

Routes are organized by domain in `src/server/features/[feature]/route.ts`:

- `src/server/features/health/route.ts` - Health checks
- `src/server/features/auth/route.ts` - NextAuth.js handler
- `src/server/features/project/route.ts` - Project management

### Middleware

- `guard()` - Requires authentication, attaches user to context
- `validate("json", schema)` - Zod validation for JSON body
- `handle()` - Wrapper for DB calls, handles errors

## Code Style

- **Biome** is the linter/formatter—not ESLint or Prettier
- `src/components/ui` and `drizzle/` are excluded from biome.json
- UI components are auto-generated (shadcn-like) and should not be manually edited
- Use Zod schemas for request validation
- Use `nanoid()` for ID generation
- **Always run `npm run format` after any code change**

### Endpoint Development

When creating or modifying API endpoints, use the **endpoint-builder** skill (`.opencode/skills/endpoint-builder/SKILL.md`):
- Provides step-by-step guidance for implementing endpoints
- Includes testing workflow with curl/curlie
- Documents code formatting rules (spacing, comments)

---

## API Endpoints

> **Legend**: `[x]` = Implemented, `[ ]` = To be implemented

### Health

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/health | Health check | [x] |

### Auth

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /api/auth/* | NextAuth.js handler | [x] |
| GET | /api/auth/* | NextAuth.js handler | [x] |

### Projects

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/projects | List all projects for user | [x] |
| POST | /api/projects | Create project | [x] |
| GET | /api/projects/:id | Get project by ID | [x] |
| PATCH | /api/projects/:id | Update project | [x] |
| DELETE | /api/projects/:id | Delete project | [x] |

**GET /api/projects**

List all projects the current user is a member of.

- Auth: Required
- Request body: None
- Response:
  ```ts
  {
    projects: Array<{
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }
  ```

**POST /api/projects**

Create a new project with the current user as owner.

- Auth: Required
- Request body:
  ```ts
  {
    name: string;       // 3-130 chars
    description?: string; // 3-800 chars, optional
  }
  ```
- Response:
  ```ts
  {
    id: string;
    name: string;
    description: string | null;
  }
  ```

**GET /api/projects/:id**

Get a specific project by ID.

- Auth: Required
- Request body: None
- Response:
  ```ts
  {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

**PATCH /api/projects/:id**

Update a project's name or description.

- Auth: Required (owner/admin only)
- Request body:
  ```ts
  {
    name?: string;       // 3-130 chars
    description?: string; // 3-800 chars
  }
  ```
- Response:
  ```ts
  {
    id: string;
    name: string;
    description: string | null;
    updatedAt: Date;
  }
  ```

**DELETE /api/projects/:id**

Delete a project.

- Auth: Required (owner only)
- Request body: None
- Response:
  ```ts
  { success: boolean; }
  ```

### Project Members

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/projects/:id/members | List project members | [x] |
| POST | /api/projects/:id/members | Add member to project | [x] |
| PATCH | /api/projects/:id/members/:memberId | Update member role | [x] |
| DELETE | /api/projects/:id/members/:memberId | Remove member from project | [x] |

**GET /api/projects/:id/members**

List all members of a project.

- Auth: Required (project member)
- Request body: None
- Response:
  ```ts
  {
    members: Array<{
      id: string;
      userId: string;
      role: "owner" | "admin" | "member";
      joinedAt: Date;
      user: { id: string; name: string; email: string; image: string | null };
    }>;
  }
  ```

**POST /api/projects/:id/members**

Add a user to a project.

- Auth: Required (owner/admin only)
- Request body:
  ```ts
  {
    email: string; // user email
    role: "admin" | "member";
  }
  ```
- Response:
  ```ts
  {
    id: string;
    userId: string;
    projectId: string;
    role: "admin" | "member";
    joinedAt: Date;
  }
  ```

**PATCH /api/projects/:id/members/:memberId**

Update a member's role.

- Auth: Required (owner only)
- Request body:
  ```ts
  {
    role: "admin" | "member";
  }
  ```
- Response:
  ```ts
  {
    id: string;
    userId: string;
    projectId: string;
    role: "admin" | "member";
    joinedAt: Date;
  }
  ```

**DELETE /api/projects/:id/members/:memberId**

Remove a member from a project.

- Auth: Required (owner/admin only)
- Request body: None
- Response:
  ```ts
  { success: boolean; }
  ```

### Boards

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/projects/:id/boards | List project boards | [x] |
| POST | /api/projects/:id/boards | Create board | [x] |
| GET | /api/projects/:id/boards/:boardId | Get board | [x] |
| PATCH | /api/projects/:id/boards/:boardId | Update board | [x] |
| DELETE | /api/projects/:id/boards/:boardId | Delete board | [ ] |
| PATCH | /api/projects/:id/boards/reorder | Reorder boards | [x] |

**GET /api/projects/:id/boards**

List all boards in a project.

- Auth: Required (project member)
- Request body: None
- Response:
  ```ts
  {
    boards: Array<{
      id: string;
      projectId: string;
      name: string;
      position: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }
  ```

**POST /api/projects/:id/boards**

Create a new board in a project.

- Auth: Required (owner/admin/member)
- Request body:
  ```ts
  {
    name: string; // 1-130 chars
  }
  ```
- Response:
  ```ts
  {
    id: string;
    projectId: string;
    name: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

**GET /api/projects/:id/boards/:boardId**

Get a specific board.

- Auth: Required (project member)
- Request body: None
- Response:
  ```ts
  {
    id: string;
    projectId: string;
    name: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

**PATCH /api/projects/:id/boards/:boardId**

Update a board's name or position.

- Auth: Required (owner/admin/member)
- Request body:
  ```ts
  {
    name?: string;
    position?: number;
  }
  ```
- Response:
  ```ts
  {
    id: string;
    projectId: string;
    name: string;
    position: number;
    updatedAt: Date;
  }
  ```

**DELETE /api/projects/:id/boards/:boardId**

Delete a board.

- Auth: Required (owner/admin only)
- Request body: None
- Response:
  ```ts
  { success: boolean; }
  ```

**PATCH /api/projects/:id/boards/reorder**

Reorder boards in a project.

- Auth: Required (owner/admin/member)
- Request body:
  ```ts
  {
    boardIds: string[]; // ordered array of board IDs
  }
  ```
- Response:
  ```ts
  { success: boolean; }
  ```

### Tasks

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/boards/:boardId/tasks | List board tasks | [x] |
| POST | /api/boards/:boardId/tasks | Create task | [x] |
| PATCH | /api/boards/:boardId/tasks/:taskId | Update task | [x] |
| DELETE | /api/boards/:boardId/tasks/:taskId | Delete task | [x] |
| PATCH | /api/tasks/:taskId/assign | Assign task to member | [x] |
| PATCH | /api/tasks/:taskId/move | Move task to board | [x] |
| PATCH | /api/tasks/:taskId/reorder | Reorder task | [x] |

**GET /api/boards/:boardId/tasks**

List all tasks in a board.

- Auth: Required (project member)
- Request body: None
- Response:
  ```ts
  {
    tasks: Array<{
      id: string;
      boardId: string;
      assigneeId: string | null;
      title: string;
      description: string | null;
      priority: "low" | "medium" | "high" | "urgent";
      position: number;
      dueDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }
  ```

**POST /api/boards/:boardId/tasks**

Create a new task in a board.

- Auth: Required (project member)
- Request body:
  ```ts
  {
    title: string;           // 1-300 chars
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent"; // default: "medium"
    assigneeId?: string;   // optional, must be project member
    dueDate?: string;       // ISO date string, optional
  }
  ```
- Response:
  ```ts
  {
    id: string;
    boardId: string;
    assigneeId: string | null;
    title: string;
    description: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    position: number;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

**PATCH /api/boards/:boardId/tasks/:taskId**

Update a task.

- Auth: Required (project member)
- Request body:
  ```ts
  {
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    dueDate?: string | null;
  }
  ```
- Response:
  ```ts
  {
    id: string;
    boardId: string;
    assigneeId: string | null;
    title: string;
    description: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    position: number;
    dueDate: Date | null;
    updatedAt: Date;
  }
  ```

**DELETE /api/boards/:boardId/tasks/:taskId**

Delete a task.

- Auth: Required (owner/admin only)
- Request body: None
- Response:
  ```ts
  { success: boolean; }
  ```

**PATCH /api/tasks/:taskId/assign**

Assign a task to a project member.

- Auth: Required (owner/admin only)
- Request body:
  ```ts
  {
    assigneeId: string; // project member ID, or null to unassign
  }
  ```
- Response:
  ```ts
  {
    id: string;
    assigneeId: string | null;
  }
  ```

**PATCH /api/tasks/:taskId/move**

Move a task to a different board.

- Auth: Required (project member)
- Request body:
  ```ts
  {
    boardId: string;
    position?: number; // optional new position
  }
  ```
- Response:
  ```ts
  {
    id: string;
    boardId: string;
    position: number;
  }
  ```

**PATCH /api/tasks/:taskId/reorder**

Reorder a task within a board.

- Auth: Required (project member)
- Request body:
  ```ts
  {
    position: number;
  }
  ```
- Response:
  ```ts
  {
    id: string;
    position: number;
  }
  ```
