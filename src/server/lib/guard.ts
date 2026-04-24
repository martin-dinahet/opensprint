import { createMiddleware } from "hono/factory";
import { auth } from "./auth";

export function guard() {
  return createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json({ success: false, errors: { root: "Not authenticated" } }, 401);
    }
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  });
}
