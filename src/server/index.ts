import { Hono } from "hono";
import { logger } from "hono/logger";
import { authController } from "./controllers/auth.controller";
import { columnController } from "./controllers/column.controller";
import { healthController } from "./controllers/health.controller";
import { projectController } from "./controllers/project.controller";
import { taskController, taskManagementController } from "./controllers/task.controller";
import { handleError } from "./lib/handle-error";
import { handleNotFound } from "./lib/handle-notfound";
import type { ServerVariables } from "./types/server-type";

export type { ServerVariables } from "./types/server-type";

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
