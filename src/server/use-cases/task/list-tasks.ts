import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertColumnAccess } from "./column-access";

export class ListTasksUseCase {
  static async execute(userId: string, columnId: string) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tasksResult = await taskRepository.findByColumn(columnId);

    if (tasksResult.isErr()) {
      return err(new AppError("tasks-fetch-failed", `Unable to fetch tasks: ${tasksResult.error.message}`, 500));
    }

    return ok(
      (tasksResult.unwrap() || []).map((t) => ({
        id: t.id,
        columnId: t.columnId,
        assigneeId: t.assigneeId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        position: t.position,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    );
  }
}
