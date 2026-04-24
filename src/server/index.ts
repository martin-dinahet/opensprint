import { Hono } from "hono";
import { logger } from "hono/logger";
import { AuthRoute } from "./features/auth/route";
import { HealthRoute } from "./features/health/route";
import { handleError } from "./lib/handle-error";
import { handleNotFound } from "./lib/handle-notfound";
import type { ServerVariables } from "./lib/types";

export type { ServerType } from "./lib/types";

export const server = new Hono<ServerVariables>()
  .use(logger())
  .notFound((c) => handleNotFound(c))
  .onError((error, c) => handleError(error, c))
  .basePath("/api")
  .route("/health", HealthRoute)
  .route("/auth", AuthRoute);
