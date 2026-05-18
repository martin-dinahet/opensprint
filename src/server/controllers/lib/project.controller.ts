import { Hono } from "hono";
import { guard } from "@/server/lib";
import { validate } from "@/server/lib";
import type { ServerVariables } from "@/server/types";
import {
  AddMemberUseCase,
  ListMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberUseCase,
} from "@/server/use-cases/member";
import { AddMemberInput, UpdateMemberInput } from "@/server/use-cases/member/dto";
import {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  UpdateProjectUseCase,
} from "@/server/use-cases/project";
import { CreateProjectInput, UpdateProjectInput } from "@/server/use-cases/project/dto";
import {
  CreateProjectTaskTagUseCase,
  DeleteProjectTaskTagUseCase,
  ListProjectTaskTagsUseCase,
  UpdateProjectTaskTagUseCase,
} from "@/server/use-cases/task";
import { CreateProjectTaskTagInput, UpdateProjectTaskTagInput } from "@/server/use-cases/task/dto";

const CreateProjectSchema = CreateProjectInput;
const UpdateProjectSchema = UpdateProjectInput;
const AddMemberSchema = AddMemberInput;
const UpdateMemberSchema = UpdateMemberInput;
const CreateProjectTaskTagSchema = CreateProjectTaskTagInput;
const UpdateProjectTaskTagSchema = UpdateProjectTaskTagInput;

export const projectController = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    const result = await ListProjectsUseCase.execute(currentUser.id);

    return result.match({
      ok: (projects) => c.json({ projects }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await GetProjectUseCase.execute(currentUser.id, projectId);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id", guard(), validate("json", UpdateProjectSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await UpdateProjectUseCase.execute(currentUser.id, projectId, body);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await CreateProjectUseCase.execute(currentUser.id, body);

    return result.match({
      ok: (project) => c.json(project),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await DeleteProjectUseCase.execute(currentUser.id, projectId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  // Member routes
  .get("/:id/members", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await ListMembersUseCase.execute(currentUser.id, projectId);

    return result.match({
      ok: (members) => c.json({ members }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:id/members", guard(), validate("json", AddMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await AddMemberUseCase.execute(currentUser.id, projectId, body);

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

    const result = await UpdateMemberUseCase.execute(currentUser.id, projectId, memberId, body);

    return result.match({
      ok: (member) => c.json(member),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id/members/:memberId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");

    const result = await RemoveMemberUseCase.execute(currentUser.id, projectId, memberId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .get("/:id/task-tags", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await ListProjectTaskTagsUseCase.execute(currentUser.id, projectId);

    return result.match({
      ok: (tags) => c.json({ tags }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:id/task-tags", guard(), validate("json", CreateProjectTaskTagSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await CreateProjectTaskTagUseCase.execute(currentUser.id, projectId, body);

    return result.match({
      ok: (tag) => c.json(tag),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id/task-tags/:tagId", guard(), validate("json", UpdateProjectTaskTagSchema), async (c) => {
    const projectId = c.req.param("id");
    const tagId = c.req.param("tagId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await UpdateProjectTaskTagUseCase.execute(currentUser.id, projectId, tagId, body);

    return result.match({
      ok: (tag) => c.json(tag),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id/task-tags/:tagId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const tagId = c.req.param("tagId");
    const currentUser = c.get("user");

    const result = await DeleteProjectTaskTagUseCase.execute(currentUser.id, projectId, tagId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
