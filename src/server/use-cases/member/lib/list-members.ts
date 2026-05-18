import { err, ok } from "@punpun-dev/ts-result";
import { AppError, UnauthorizedError } from "@/server/lib";
import { memberRepository } from "@/server/repositories";

export class ListMembersUseCase {
  static async execute(userId: string, projectId: string) {
    const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
    if (membershipResult.isErr()) return err(membershipResult.error);

    const membership = membershipResult.unwrap();
    if (!membership || membership.length === 0) {
      return err(new UnauthorizedError("Not a member of this project"));
    }

    const membersResult = await memberRepository.findByProject(projectId);

    if (membersResult.isErr()) {
      return err(new AppError("members-fetch-failed", `Unable to fetch members: ${membersResult.error.message}`, 500));
    }

    const allUsersResult = await memberRepository.findUsers();
    if (allUsersResult.isErr()) return err(allUsersResult.error);

    return ok(
      (membersResult.unwrap() || []).map((member) => {
        const userData = allUsersResult.unwrap()?.find((u) => u.id === member.userId);
        return {
          id: member.id,
          userId: member.userId,
          projectId: member.projectId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            id: userData?.id,
            name: userData?.name,
            email: userData?.email,
            image: userData?.image,
          },
        };
      }),
    );
  }
}
