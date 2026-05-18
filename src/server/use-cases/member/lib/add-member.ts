import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { memberRepository } from "@/server/repositories";
import type { AddMemberInput } from "../dto";

export class AddMemberUseCase {
  static async execute(userId: string, projectId: string, input: AddMemberInput) {
    const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
    if (membershipResult.isErr()) return err(membershipResult.error);

    const membership = membershipResult.unwrap();
    if (!membership || membership.length === 0) {
      return err(new UnauthorizedError("Not authorized"));
    }

    if (membership[0].role === "member") {
      return err(new UnauthorizedError("Not authorized"));
    }

    const targetUserResult = await memberRepository.findUserByEmail(input.email);
    if (targetUserResult.isErr()) return err(targetUserResult.error);

    const targetUser = targetUserResult.unwrap();
    if (!targetUser || targetUser.length === 0) {
      return err(new NotFoundError("User"));
    }

    const existingMemberResult = await memberRepository.findByUserAndProject(targetUser[0].id, projectId);
    if (existingMemberResult.isErr()) return err(existingMemberResult.error);

    if (existingMemberResult.unwrap() && existingMemberResult.unwrap().length > 0) {
      return err(new ConflictError("User is already a member"));
    }

    const memberId = nanoid();

    const addMemberResult = await memberRepository.create({
      id: memberId,
      projectId,
      userId: targetUser[0].id,
      role: input.role,
    });

    if (addMemberResult.isErr()) {
      return err(new AppError("member-add-failed", `Unable to add member: ${addMemberResult.error.message}`, 500));
    }

    return ok({
      id: memberId,
      userId: targetUser[0].id,
      projectId,
      role: input.role,
      joinedAt: new Date(),
    });
  }
}
