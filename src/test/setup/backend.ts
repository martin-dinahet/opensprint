import { vi } from "vitest";

process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/opensprint_test";
process.env.BETTER_AUTH_SECRET ??= "test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

vi.mock("hono/logger", () => ({
  logger: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));
