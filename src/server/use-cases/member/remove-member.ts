import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/lib/errors";
import { memberRepository } from "@/server/repositories/member.repository";
import { taskRepository } from "@/server/repositories/task.repository";

export class RemoveMemberUseCase {
  static async execute(userId: string, projectId: string, memberId: string) {
    const currentMembershipResult = await memberRepository.findByUserAndProject(userId, projectId);
    if (currentMembershipResult.isErr()) return err(currentMembershipResult.error);

    const currentMembership = currentMembershipResult.unwrap();
    if (!currentMembership || currentMembership.length === 0) {
      return err(new UnauthorizedError("Not authorized"));
    }

    if (currentMembership[0].role === "member") {
      return err(new UnauthorizedError("Not authorized"));
    }

    const targetMemberResult = await memberRepository.findById(memberId);
    if (targetMemberResult.isErr()) return err(targetMemberResult.error);

    const targetMember = targetMemberResult.unwrap();
    if (!targetMember || targetMember.length === 0) {
      return err(new NotFoundError("Member"));
    }

    if (targetMember[0].role === "owner") {
      return err(new ForbiddenError("Cannot remove owner"));
    }

    const clearAssigneeResult = await taskRepository.clearAssignee(memberId);

    if (clearAssigneeResult.isErr()) {
      return err(
        new AppError(
          "member-task-unassign-failed",
          `Unable to unassign member tasks: ${clearAssigneeResult.error.message}`,
          500,
        ),
      );
    }

    const deleteResult = await memberRepository.delete(memberId);

    if (deleteResult.isErr()) {
      return err(new AppError("member-remove-failed", `Unable to remove member: ${deleteResult.error.message}`, 500));
    }

    return ok({ success: true });
  }
}
