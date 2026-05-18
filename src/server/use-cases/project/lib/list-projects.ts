import { err, ok } from "@punpun-dev/ts-result";
import { memberRepository } from "@/server/repositories";
import { projectRepository } from "@/server/repositories";

export class ListProjectsUseCase {
  static async execute(userId: string) {
    const membershipsResult = await memberRepository.findByUserId(userId);
    if (membershipsResult.isErr()) return err(membershipsResult.error);

    const memberships = membershipsResult.unwrap();
    if (!memberships || memberships.length === 0) {
      return ok([]);
    }

    const projectIds = memberships.map((m) => m.projectId);
    const projectsResult = await projectRepository.findByIds(projectIds);
    if (projectsResult.isErr()) return err(projectsResult.error);

    const projects = projectsResult.unwrap();

    return ok(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    );
  }
}
