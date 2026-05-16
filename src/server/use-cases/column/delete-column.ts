import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError } from "@/server/lib/errors";
import { columnRepository } from "@/server/repositories/column.repository";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertProjectAccess } from "./project-access";

export class DeleteColumnUseCase {
  static async execute(userId: string, projectId: string, columnId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const { membership } = accessResult.unwrap();
    if (membership.role === "member") return err(new ForbiddenError("Not authorized"));

    const columnResult = await columnRepository.findById(columnId);
    if (columnResult.isErr()) return err(columnResult.error);

    const column = columnResult.unwrap();
    if (!column || column.length === 0 || column[0].projectId !== projectId) return err(new NotFoundError("Column"));

    const deleteTasksResult = await taskRepository.deleteByColumn(columnId);
    if (deleteTasksResult.isErr()) {
      return err(
        new AppError(
          "column-tasks-delete-failed",
          `Unable to delete column tasks: ${deleteTasksResult.error.message}`,
          500,
        ),
      );
    }

    const deleteResult = await columnRepository.delete(columnId);
    if (deleteResult.isErr()) {
      return err(new AppError("column-delete-failed", `Unable to delete column: ${deleteResult.error.message}`, 500));
    }

    return ok({ success: true });
  }
}
