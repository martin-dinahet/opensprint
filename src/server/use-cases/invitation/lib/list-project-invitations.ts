import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { invitationRepository } from "@/server/repositories";
import { getManageInvitationMembership } from "./access";
import { toInvitationOutput } from "./invitation-output";

export class ListProjectInvitationsUseCase {
  static async execute(userId: string, projectId: string) {
    const accessResult = await getManageInvitationMembership(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const invitationsResult = await invitationRepository.findPendingByProject(projectId);
    if (invitationsResult.isErr()) {
      return err(
        new AppError(
          "invitations-fetch-failed",
          `Unable to fetch invitations: ${invitationsResult.error.message}`,
          500,
        ),
      );
    }

    return ok(invitationsResult.unwrap().map((row) => toInvitationOutput(row)));
  }
}
