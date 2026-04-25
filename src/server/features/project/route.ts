import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { CreateProjectInput, UpdateProjectInput } from "@/server/dto";
import {
  listProjectsUseCase,
  createProjectUseCase,
  getProjectUseCase,
  updateProjectUseCase,
  deleteProjectUseCase,
} from "@/server/usecases";
import { AppError } from "@/server/usecases/errors";

const CreateProjectSchema = CreateProjectInput;
const UpdateProjectSchema = UpdateProjectInput;

export const projectRoute = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    try {
      const projects = await listProjectsUseCase.execute(currentUser.id);
      return c.json({ projects });
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to fetch projects: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to fetch projects" } }, 500);
    }
  })

  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    try {
      const project = await getProjectUseCase.execute(currentUser.id, projectId);
      return c.json(project);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to find project: ${error}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }
  })

  .patch("/:id", guard(), validate("json", UpdateProjectSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const project = await updateProjectUseCase.execute(currentUser.id, projectId, body);
      return c.json(project);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to update project: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to update project" } }, 500);
    }
  })

  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const project = await createProjectUseCase.execute(currentUser.id, body);
      return c.json(project);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to create project: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to create project" } }, 500);
    }
  })

  .delete("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    try {
      const result = await deleteProjectUseCase.execute(currentUser.id, projectId);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to delete project: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to delete project" } }, 500);
    }
  });
