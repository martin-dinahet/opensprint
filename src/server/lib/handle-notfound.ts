import type { Context } from "hono";

export function handleNotFound(c: Context) {
  return c.json({ success: false, errors: { root: ["Route not found"] } }, 404);
}
