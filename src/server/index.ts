import { Hono } from "hono";
import { logger } from "hono/logger";
import {
  authController,
  columnController,
  healthController,
  projectController,
  taskController,
  taskManagementController,
} from "./controllers";
import { handleError, handleNotFound } from "./lib";
import type { ServerVariables } from "./types";

export type { ServerVariables } from "./types";

const app = new Hono<ServerVariables>()
  .use(logger())
  .notFound((c) => handleNotFound(c))
  .onError((error, c) => handleError(error, c))
  .basePath("/api")
  .route("/health", healthController)
  .route("/auth", authController)
  .route("/projects", projectController)
  .route("/projects", columnController)
  .route("/columns", taskController)
  .route("/tasks", taskManagementController);

export type ServerType = typeof app;
export { app as server };
