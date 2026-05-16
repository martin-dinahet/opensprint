import { Hono } from "hono";
import { auth } from "@/server/lib/auth";

export const authController = new Hono() //
  .post("/*", (c) => {
    return auth.handler(c.req.raw);
  })
  .get("/*", (c) => {
    return auth.handler(c.req.raw);
  });
