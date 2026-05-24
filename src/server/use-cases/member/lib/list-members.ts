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

    const membersResult = await memberRepository.findByProjectWithUsers(projectId);

    if (membersResult.isErr()) {
      return err(new AppError("members-fetch-failed", `Unable to fetch members: ${membersResult.error.message}`, 500));
    }

    return ok(
      (membersResult.unwrap() || []).map(({ member, user }) => {
        return {
          id: member.id,
          userId: member.userId,
          projectId: member.organizationId,
          role: member.role,
          createdAt: member.createdAt,
          joinedAt: member.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        };
      }),
    );
  }
}
