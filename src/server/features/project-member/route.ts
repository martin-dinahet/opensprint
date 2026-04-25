import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { AddMemberInput, UpdateMemberInput } from "@/server/dto";
import { listMembersUseCase, addMemberUseCase, updateMemberUseCase, removeMemberUseCase } from "@/server/usecases";
import { AppError } from "@/server/usecases/errors";

const AddMemberSchema = AddMemberInput;
const UpdateMemberSchema = UpdateMemberInput;

export const projectMemberRoute = new Hono<ServerVariables>() //
  .get("/:id/members", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    try {
      const members = await listMembersUseCase.execute(currentUser.id, projectId);
      return c.json({ members });
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to fetch members: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to fetch members" } }, 500);
    }
  })

  .post("/:id/members", guard(), validate("json", AddMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const member = await addMemberUseCase.execute(currentUser.id, projectId, body);
      return c.json(member);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to add member: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to add member" } }, 500);
    }
  })

  .patch("/:id/members/:memberId", guard(), validate("json", UpdateMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const member = await updateMemberUseCase.execute(currentUser.id, projectId, memberId, body);
      return c.json(member);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to update member: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to update member" } }, 500);
    }
  })

  .delete("/:id/members/:memberId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");

    try {
      const result = await removeMemberUseCase.execute(currentUser.id, projectId, memberId);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to remove member: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to remove member" } }, 500);
    }
  });
