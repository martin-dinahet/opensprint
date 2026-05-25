import { err, ok } from "@punpun-dev/ts-result";
import { NotFoundError, UnauthorizedError } from "@/server/lib";
import { boardRepository, memberRepository, projectRepository, taskRepository } from "@/server/repositories";

export class GetProjectUseCase {
  static async execute(userId: string, projectId: string) {
    const projectResult = await projectRepository.findById(projectId);
    if (projectResult.isErr()) return err(projectResult.error);

    const project = projectResult.unwrap();
    if (!project || project.length === 0) {
      return err(new NotFoundError("Project"));
    }

    const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
    if (membershipResult.isErr()) return err(membershipResult.error);

    const membership = membershipResult.unwrap();
    if (!membership || membership.length === 0) {
      return err(new UnauthorizedError("Not a member of this project"));
    }

    const boardsResult = await boardRepository.findByProject(projectId);
    if (boardsResult.isErr()) return err(boardsResult.error);

    const memberCountsResult = await memberRepository.countByProjectIds([projectId]);
    if (memberCountsResult.isErr()) return err(memberCountsResult.error);

    const taskCountsResult = await taskRepository.countByProjectIds([projectId]);
    if (taskCountsResult.isErr()) return err(taskCountsResult.error);

    return ok({
      id: project[0].id,
      name: project[0].name,
      description: project[0].description,
      defaultBoardId: boardsResult.unwrap()?.[0]?.id ?? null,
      memberCount: memberCountsResult.unwrap()[0]?.count ?? 0,
      openTaskCount: taskCountsResult.unwrap()[0]?.count ?? 0,
      status: project[0].status,
      createdAt: project[0].createdAt,
      updatedAt: project[0].updatedAt,
    });
  }
}
