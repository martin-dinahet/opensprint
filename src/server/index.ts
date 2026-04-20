import { Hono } from "hono";
import { logger } from "hono/logger";

export type ServerType = typeof server;
export const server = new Hono()
	.basePath("/api")
	.use(logger())
	.get("/health", (c) => {
		return c.json({ status: "OK" });
	});
