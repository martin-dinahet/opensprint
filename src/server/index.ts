import { Hono } from "hono";
import { logger } from "hono/logger";
import { AuthRoute } from "./features/auth/route";
import { HealthRoute } from "./features/health/route";

export type ServerType = typeof server;
export const server = new Hono()
	.use(logger())
	.basePath("/api")
	.route("/health", HealthRoute)
	.route("/auth", AuthRoute);
