import { Hono } from "hono";
import { CreateProjectInput, UpdateProjectInput } from "@/server/features/project/dto";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/server/features/project/usecases";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateProjectSchema = CreateProjectInput;
const UpdateProjectSchema = UpdateProjectInput;

export const projectRoute = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    const result = await listProjects(currentUser.id);

    return result.match({
      ok: (projects) => c.json({ projects }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await getProject(currentUser.id, projectId);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id", guard(), validate("json", UpdateProjectSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await updateProject(currentUser.id, projectId, body);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await createProject(currentUser.id, body);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await deleteProject(currentUser.id, projectId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
