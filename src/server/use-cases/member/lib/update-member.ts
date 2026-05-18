import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { memberRepository } from "@/server/repositories";
import type { UpdateMemberInput } from "../dto";

export class UpdateMemberUseCase {
  static async execute(userId: string, projectId: string, memberId: string, input: UpdateMemberInput) {
    const currentMembershipResult = await memberRepository.findByUserAndProject(userId, projectId);
    if (currentMembershipResult.isErr()) return err(currentMembershipResult.error);

    const currentMembership = currentMembershipResult.unwrap();
    if (!currentMembership || currentMembership.length === 0) {
      return err(new UnauthorizedError("Not authorized"));
    }

    if (currentMembership[0].role !== "owner") {
      return err(new UnauthorizedError("Not authorized"));
    }

    const targetMemberResult = await memberRepository.findById(memberId);
    if (targetMemberResult.isErr()) return err(targetMemberResult.error);

    const targetMember = targetMemberResult.unwrap();
    if (!targetMember || targetMember.length === 0) {
      return err(new NotFoundError("Member"));
    }

    if (targetMember[0].role === "owner") {
      return err(new ForbiddenError("Cannot change owner's role"));
    }

    const updateResult = await memberRepository.update(memberId, input);

    if (updateResult.isErr()) {
      return err(new AppError("member-update-failed", `Unable to update member: ${updateResult.error.message}`, 500));
    }

    return ok({
      id: targetMember[0].id,
      userId: targetMember[0].userId,
      projectId: targetMember[0].projectId,
      role: input.role,
      joinedAt: targetMember[0].joinedAt,
    });
  }
}
