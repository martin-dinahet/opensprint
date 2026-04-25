import { Hono } from "hono";
import { auth } from "@/server/lib/auth";

export const AuthRoute = new Hono() //
  .post("/*", (c) => {
    return auth.handler(c.req.raw);
  })
  .get("/*", (c) => {
    return auth.handler(c.req.raw);
  });
