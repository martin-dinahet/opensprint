import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";
import { memberRepository } from "@/server/repositories";
import { projectRepository } from "@/server/repositories";
import { taskRepository } from "@/server/repositories";

export class DeleteProjectUseCase {
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
      return err(new UnauthorizedError("Not authorized"));
    }

    if (membership[0].role !== "owner") {
      return err(new UnauthorizedError("Not authorized"));
    }

    const columnsResult = await columnRepository.findByProject(projectId);
    if (columnsResult.isErr()) return err(columnsResult.error);

    for (const column of columnsResult.unwrap() ?? []) {
      const deleteTasksResult = await taskRepository.deleteByColumn(column.id);
      if (deleteTasksResult.isErr()) {
        return err(
          new AppError(
            "project-tasks-delete-failed",
            `Unable to delete project tasks: ${deleteTasksResult.error.message}`,
            500,
          ),
        );
      }
    }

    for (const column of columnsResult.unwrap() ?? []) {
      const deleteColumnResult = await columnRepository.delete(column.id);
      if (deleteColumnResult.isErr()) {
        return err(
          new AppError(
            "project-columns-delete-failed",
            `Unable to delete project columns: ${deleteColumnResult.error.message}`,
            500,
          ),
        );
      }
    }

    const deleteMembersResult = await memberRepository.deleteByProject(projectId);
    if (deleteMembersResult.isErr()) return err(deleteMembersResult.error);

    const deleteProjectResult = await projectRepository.delete(projectId);
    if (deleteProjectResult.isErr()) return err(deleteProjectResult.error);

    return ok({ success: true });
  }
}
