import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { memberRepository, projectRepository } from "@/server/repositories";
import type { UpdateProjectInput } from "../dto";

export class UpdateProjectUseCase {
  static async execute(userId: string, projectId: string, input: UpdateProjectInput) {
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
      return err(new UnauthorizedError("Not authorized"));
    }

    if (membership[0].role === "member") {
      return err(new UnauthorizedError("Not authorized"));
    }

    const updateResult = await projectRepository.update(projectId, {
      name: input.name,
      description: input.description,
      status: input.status,
    });

    if (updateResult.isErr()) {
      return err(new AppError("project-update-failed", `Unable to update project: ${updateResult.error.message}`, 500));
    }

    const updatedProjectResult = await projectRepository.findById(projectId);
    if (updatedProjectResult.isErr()) return err(updatedProjectResult.error);

    const updated = updatedProjectResult.unwrap()?.[0];

    if (!updated) {
      return err(new NotFoundError("Project"));
    }

    return ok({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  }
}
