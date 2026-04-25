import { Hono } from "hono";
import { AddMemberInput, UpdateMemberInput } from "@/server/features/member/dto";
import { addMember, listMembers, removeMember, updateMember } from "@/server/features/member/usecases";
import { guard } from "@/server/lib/guard";
import { handleUseCase } from "@/server/lib/handle-use-case";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const AddMemberSchema = AddMemberInput;
const UpdateMemberSchema = UpdateMemberInput;

export const projectMemberRoute = new Hono<ServerVariables>() //
  .get("/:id/members", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(listMembers(currentUser.id, projectId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json({ members: data });
  })

  .post("/:id/members", guard(), validate("json", AddMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(addMember(currentUser.id, projectId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:id/members/:memberId", guard(), validate("json", UpdateMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(updateMember(currentUser.id, projectId, memberId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .delete("/:id/members/:memberId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(removeMember(currentUser.id, projectId, memberId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  });
