import { err, ok } from "@punpun-dev/ts-result";
import { boardRepository, memberRepository, projectRepository } from "@/server/repositories";

export class ListProjectsUseCase {
  static async execute(userId: string) {
    const membershipsResult = await memberRepository.findByUserId(userId);
    if (membershipsResult.isErr()) return err(membershipsResult.error);

    const memberships = membershipsResult.unwrap();
    if (!memberships || memberships.length === 0) {
      return ok([]);
    }

    const projectIds = memberships.map((m) => m.organizationId);
    const projectsResult = await projectRepository.findByIds(projectIds);
    if (projectsResult.isErr()) return err(projectsResult.error);

    const projects = projectsResult.unwrap();
    const defaultBoardIds = new Map<string, string | null>();

    for (const project of projects) {
      const boardsResult = await boardRepository.findByProject(project.id);
      if (boardsResult.isErr()) return err(boardsResult.error);
      defaultBoardIds.set(project.id, boardsResult.unwrap()?.[0]?.id ?? null);
    }

    return ok(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        defaultBoardId: defaultBoardIds.get(p.id) ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    );
  }
}
