import { Hono } from "hono";
import { handleUseCase } from "@/server/lib/handle-use-case";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { CreateProjectInput, UpdateProjectInput } from "@/server/features/project/dto";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/server/features/project/usecases";

const CreateProjectSchema = CreateProjectInput;
const UpdateProjectSchema = UpdateProjectInput;

export const projectRoute = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(listProjects(currentUser.id));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json({ projects: data });
  })

  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(getProject(currentUser.id, projectId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:id", guard(), validate("json", UpdateProjectSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(updateProject(currentUser.id, projectId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(createProject(currentUser.id, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .delete("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(deleteProject(currentUser.id, projectId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  });
