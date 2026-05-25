import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ConflictError, NotFoundError } from "@/server/lib";
import { invitationRepository } from "@/server/repositories";
import { getManageInvitationMembership } from "./access";

export class CancelInvitationUseCase {
  static async execute(userId: string, projectId: string, invitationId: string) {
    const accessResult = await getManageInvitationMembership(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const invitationResult = await invitationRepository.findById(invitationId);
    if (invitationResult.isErr()) return err(invitationResult.error);

    const invitation = invitationResult.unwrap()[0];
    if (!invitation || invitation.organizationId !== projectId) {
      return err(new NotFoundError("Invitation"));
    }

    if (invitation.status !== "pending") {
      return err(new ConflictError("Invitation is not pending"));
    }

    const updateResult = await invitationRepository.updateStatus(invitationId, "canceled");
    if (updateResult.isErr()) {
      return err(
        new AppError("invitation-cancel-failed", `Unable to cancel invitation: ${updateResult.error.message}`, 500),
      );
    }

    return ok({ success: true });
  }
}
