import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { invitationRepository } from "@/server/repositories";
import { toInvitationOutput } from "./invitation-output";

export class ListUserInvitationsUseCase {
  static async execute(email: string) {
    const invitationsResult = await invitationRepository.findPendingForEmail(email.trim().toLowerCase(), new Date());
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
