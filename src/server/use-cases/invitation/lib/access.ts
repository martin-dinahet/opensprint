import { err, ok } from "@punpun-dev/ts-result";
import { type AppError, ForbiddenError } from "@/server/lib";
import { memberRepository } from "@/server/repositories";
import type { Member } from "@/shared";

export async function getManageInvitationMembership(
  userId: string,
  projectId: string,
): Promise<ReturnType<typeof ok<Member>> | ReturnType<typeof err<AppError>>> {
  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap()[0];
  if (!membership || membership.role === "member") {
    return err(new ForbiddenError("Not authorized"));
  }

  return ok(membership);
}
