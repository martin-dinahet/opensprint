import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/server/lib";
import { invitationRepository, memberRepository } from "@/server/repositories";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export class AcceptInvitationUseCase {
  static async execute(userId: string, userEmail: string, invitationId: string) {
    const invitationResult = await invitationRepository.findById(invitationId);
    if (invitationResult.isErr()) return err(invitationResult.error);

    const invitation = invitationResult.unwrap()[0];
    if (!invitation) return err(new NotFoundError("Invitation"));

    if (invitation.email !== normalizeEmail(userEmail)) {
      return err(new ForbiddenError("Not authorized"));
    }

    if (invitation.status !== "pending") {
      return err(new ConflictError("Invitation is not pending"));
    }

    if (invitation.expiresAt <= new Date()) {
      const expireResult = await invitationRepository.updateStatus(invitation.id, "expired");
      if (expireResult.isErr()) return err(expireResult.error);
      return err(new ConflictError("Invitation has expired"));
    }

    const existingMemberResult = await memberRepository.findByUserAndProject(userId, invitation.organizationId);
    if (existingMemberResult.isErr()) return err(existingMemberResult.error);

    if (existingMemberResult.unwrap().length > 0) {
      return err(new ConflictError("User is already a member"));
    }

    const memberId = nanoid();
    const createMemberResult = await memberRepository.create({
      id: memberId,
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role as "admin" | "member",
    });

    if (createMemberResult.isErr()) {
      return err(
        new AppError("member-create-failed", `Unable to create member: ${createMemberResult.error.message}`, 500),
      );
    }

    const updateResult = await invitationRepository.updateStatus(invitation.id, "accepted");
    if (updateResult.isErr()) {
      return err(
        new AppError("invitation-accept-failed", `Unable to accept invitation: ${updateResult.error.message}`, 500),
      );
    }

    return ok({
      id: memberId,
      projectId: invitation.organizationId,
      userId,
      role: invitation.role as "admin" | "member",
      createdAt: new Date(),
      joinedAt: new Date(),
    });
  }
}

export class DeclineInvitationUseCase {
  static async execute(_userId: string, userEmail: string, invitationId: string) {
    const invitationResult = await invitationRepository.findById(invitationId);
    if (invitationResult.isErr()) return err(invitationResult.error);

    const invitation = invitationResult.unwrap()[0];
    if (!invitation) return err(new NotFoundError("Invitation"));

    if (invitation.email !== normalizeEmail(userEmail)) {
      return err(new ForbiddenError("Not authorized"));
    }

    if (invitation.status !== "pending") {
      return err(new ConflictError("Invitation is not pending"));
    }

    const updateResult = await invitationRepository.updateStatus(invitation.id, "declined");
    if (updateResult.isErr()) {
      return err(
        new AppError("invitation-decline-failed", `Unable to decline invitation: ${updateResult.error.message}`, 500),
      );
    }

    return ok({ success: true });
  }
}
