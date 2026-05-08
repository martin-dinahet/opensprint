# OpenSprint

OpenSprint is a Next.js 16, React 19, Tailwind CSS 4, Hono, Drizzle ORM, PostgreSQL, better-auth app.

## Commands

Use the package scripts in `package.json`.

```bash
pnpm run dev            # Next.js dev server
pnpm run build          # production build
pnpm run start          # serve production build

pnpm run lint           # biome lint
pnpm run format         # biome format --write
pnpm run check          # biome check --write

pnpm run test           # all Vitest projects
pnpm run test:backend   # backend tests only
pnpm run test:frontend  # frontend tests only
pnpm run test:coverage  # coverage report

pnpm run db:up          # docker compose up -d
pnpm run db:down        # docker compose down
pnpm run db:clean       # docker compose down -v
pnpm run db:generate    # drizzle-kit generate
pnpm run db:migrate     # drizzle-kit migrate
```

## Requirements

- `DATABASE_URL` is required by `drizzle.config.ts`.
- Docker must be running for database commands.
- The repo has a `pnpm-lock.yaml`; prefer `pnpm` for package operations.

## Architecture

- `src/app/` contains Next.js route entry points.
- `src/_pages/` contains page compositions imported through the `@/pages/*` alias.
- `src/widgets/`, `src/features/`, `src/entities/`, and `src/shared/` follow a feature-sliced frontend structure.
- `src/shared/ui/` contains generated shadcn-style UI primitives. Do not manually edit these unless the user explicitly asks.
- `src/server/` contains the Hono API mounted at `/api`.
- `src/server/db/` contains Drizzle setup, schemas, relations, and generated migrations live in `drizzle/`.

### Server Features

Backend features live in `src/server/features/[feature]/`.

```text
src/server/features/project/
  dto/index.ts           # Zod request schemas and inferred input types
  repositories/index.ts  # Drizzle database operations
  usecases/index.ts      # business rules and Result values
  route.ts               # Hono handlers and response mapping
```

Current server features include `auth`, `health`, `project`, `project-member`, `member`, `board`, `task`, and `shared`.

Use the routes in `src/server/index.ts` and each feature's `route.ts` as the source of truth for API endpoints. Avoid duplicating full endpoint catalogs in docs; they drift quickly.

### API Patterns

- Use `guard()` for authenticated routes; it attaches the current user to Hono context.
- Use `validate("json", Schema)` for JSON request bodies.
- Keep request validation in `dto/index.ts` with Zod.
- Use repository functions for database access and `handle()` where it matches existing repository style.
- Return `ok(...)` / `err(...)` from use cases via `@punpun-dev/ts-result`.
- In routes, use `result.match({ ok, err })` to map use case results to HTTP responses.
- Use shared errors from `src/server/features/shared/errors.ts` (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `AppError`) instead of ad hoc status objects.
- Use `nanoid()` for generated IDs.

### Frontend Patterns

- Keep page-level composition in `src/_pages`.
- Keep reusable business UI in `src/entities`, workflow UI in `src/features`, and cross-feature UI/providers/hooks in `src/shared`.
- Use TanStack Query for server state and the shared API result helpers in `src/shared/api`.
- Prefer existing components and hooks before adding new abstractions.
- Use `@/pages/*` and `@/*` imports instead of long relative paths when practical.

## Code Style

- Biome is the formatter and linter. Do not add ESLint or Prettier config.
- `src/shared/ui` and `drizzle` are excluded from Biome in `biome.json`.
- Run `pnpm run format` after code changes.
- Run focused tests for changed behavior, then broader tests when the change touches shared contracts.
- Keep edits scoped. Do not refactor unrelated modules while implementing a feature.

## Testing

- Backend tests: colocated under `src/server/**/*.test.ts`, Node environment, setup in `src/test/setup/backend.ts`.
- Frontend tests: `src/**/*.test.ts(x)` outside `src/server`, jsdom environment, setup in `src/test/setup/frontend.ts`.
- Shared factories and render helpers live in `src/test/`.

## Database

- Schema files live in `src/server/db/schemas/auth/` and `src/server/db/schemas/business/`.
- Export schema wiring through `src/server/db/schema.ts` and relations through `src/server/db/relations.ts`.
- Generate migrations with `pnpm run db:generate`; do not hand-edit generated migration snapshots unless the user explicitly asks.
