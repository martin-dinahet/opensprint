import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import { validate } from "@/server/lib/validate";
import type { ServerVariables } from "@/server/types/server-type";
import { addMember, listMembers, removeMember, updateMember } from "@/server/use-cases/member";
import { AddMemberInput, UpdateMemberInput } from "@/server/use-cases/member/dto";
import { createProject, deleteProject, getProject, listProjects, updateProject } from "@/server/use-cases/project";
import { CreateProjectInput, UpdateProjectInput } from "@/server/use-cases/project/dto";

const CreateProjectSchema = CreateProjectInput;
const UpdateProjectSchema = UpdateProjectInput;
const AddMemberSchema = AddMemberInput;
const UpdateMemberSchema = UpdateMemberInput;

export const projectController = new Hono<ServerVariables>() //
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
  })

  // Project member routes
  .get("/:id/members", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await listMembers(currentUser.id, projectId);

    return result.match({
      ok: (members) => c.json({ members }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:id/members", guard(), validate("json", AddMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await addMember(currentUser.id, projectId, body);

    return result.match({
      ok: (member) => c.json(member),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id/members/:memberId", guard(), validate("json", UpdateMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await updateMember(currentUser.id, projectId, memberId, body);

    return result.match({
      ok: (member) => c.json(member),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id/members/:memberId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");

    const result = await removeMember(currentUser.id, projectId, memberId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
