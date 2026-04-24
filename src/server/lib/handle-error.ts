import type { Context } from "hono";
import type { HTTPResponseError } from "hono/types";

export function handleError(error: Error | HTTPResponseError, c: Context) {
  console.error(error);
  return c.json({ success: false, errors: { root: ["Internal server error"] } }, 500);
}
