import { Hono } from "hono";
import { guard } from "@/server/lib";
import type { ServerVariables } from "@/server/types";
import {
  AcceptInvitationUseCase,
  DeclineInvitationUseCase,
  ListUserInvitationsUseCase,
} from "@/server/use-cases/invitation";

export const invitationController = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    const result = await ListUserInvitationsUseCase.execute(currentUser.email);

    return result.match({
      ok: (invitations) => c.json({ invitations }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:invitationId/accept", guard(), async (c) => {
    const invitationId = c.req.param("invitationId");
    const currentUser = c.get("user");

    const result = await AcceptInvitationUseCase.execute(currentUser.id, currentUser.email, invitationId);

    return result.match({
      ok: (member) => c.json(member),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:invitationId/decline", guard(), async (c) => {
    const invitationId = c.req.param("invitationId");
    const currentUser = c.get("user");

    const result = await DeclineInvitationUseCase.execute(currentUser.id, currentUser.email, invitationId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
