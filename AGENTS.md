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

## Code Style

- **Biome** is the linter/formatter—not ESLint or Prettier
- `src/components/ui` and `drizzle/` are excluded from biome.json
- UI components are auto-generated (shadcn-like) and should not be manually edited

## Architecture

- `src/app/` - Next.js App Router pages
- `src/features/` - Feature modules (auth, etc.)
- `src/server/db/` - Drizzle schema and relations
- `drizzle/` - Generated migrations (do not edit)