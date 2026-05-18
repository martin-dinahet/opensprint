import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib";
import { taskRepository } from "@/server/repositories";
import { assertColumnAccess } from "./column-access";
import type { ReorderTaskInput } from "../dto";
import { insertTaskAtPosition, normalizeTaskPositions } from "./task-position";

export class ReorderTaskUseCase {
  static async execute(userId: string, taskId: string, input: ReorderTaskInput) {
    const taskResult = await taskRepository.findById(taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const task = taskResult.unwrap();
    if (!task || task.length === 0) {
      return err(new NotFoundError("Task"));
    }

    const accessResult = await assertColumnAccess(userId, task[0].columnId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tasksResult = await taskRepository.findByColumn(task[0].columnId);
    if (tasksResult.isErr()) return err(tasksResult.error);

    const reorderedTasks = insertTaskAtPosition(tasksResult.unwrap() ?? [], taskId, input.position);
    const updateResult = await normalizeTaskPositions(reorderedTasks);

    if (updateResult.isErr()) {
      return err(new AppError("task-reorder-failed", `Unable to reorder task: ${updateResult.error.message}`, 500));
    }

    return ok({
      id: task[0].id,
      position: Math.max(0, Math.min(input.position, reorderedTasks.length - 1)),
    });
  }
}
