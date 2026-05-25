import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, ConflictError, NotFoundError } from "@/server/lib";
import { invitationRepository, memberRepository } from "@/server/repositories";
import type { CreateInvitationInput } from "../dto";
import { getManageInvitationMembership } from "./access";

const INVITATION_TTL_DAYS = 7;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export class CreateInvitationUseCase {
  static async execute(userId: string, projectId: string, input: CreateInvitationInput) {
    const accessResult = await getManageInvitationMembership(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const email = normalizeEmail(input.email);
    const targetUserResult = await memberRepository.findUserByEmail(email);
    if (targetUserResult.isErr()) return err(targetUserResult.error);

    const targetUser = targetUserResult.unwrap()[0];
    if (!targetUser) {
      return err(new NotFoundError("User"));
    }

    const existingMemberResult = await memberRepository.findByUserAndProject(targetUser.id, projectId);
    if (existingMemberResult.isErr()) return err(existingMemberResult.error);

    if (existingMemberResult.unwrap().length > 0) {
      return err(new ConflictError("User is already a member"));
    }

    const existingInviteResult = await invitationRepository.findPendingByProjectAndEmail(projectId, email);
    if (existingInviteResult.isErr()) return err(existingInviteResult.error);

    if (existingInviteResult.unwrap().length > 0) {
      return err(new ConflictError("Invitation is already pending"));
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

    const id = nanoid();
    const createResult = await invitationRepository.create({
      id,
      organizationId: projectId,
      email,
      role: input.role,
      inviterId: userId,
      expiresAt,
    });

    if (createResult.isErr()) {
      return err(
        new AppError("invitation-create-failed", `Unable to create invitation: ${createResult.error.message}`, 500),
      );
    }

    return ok({
      id,
      projectId,
      email,
      role: input.role,
      status: "pending" as const,
      expiresAt,
      createdAt,
    });
  }
}
