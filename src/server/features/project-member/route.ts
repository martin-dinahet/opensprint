import { Hono } from "hono";
import { AddMemberInput, UpdateMemberInput } from "@/server/features/member/dto";
import { addMember, listMembers, removeMember, updateMember } from "@/server/features/member/usecases";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const AddMemberSchema = AddMemberInput;
const UpdateMemberSchema = UpdateMemberInput;

export const projectMemberRoute = new Hono<ServerVariables>() //
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
