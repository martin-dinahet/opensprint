import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertColumnAccess } from "./column-access";
import type { MoveTaskInput } from "./dto";
import { normalizeTaskPositions } from "./task-position";

export class MoveTaskUseCase {
  static async execute(userId: string, taskId: string, input: MoveTaskInput) {
    const taskResult = await taskRepository.findById(taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const task = taskResult.unwrap();
    if (!task || task.length === 0) {
      return err(new NotFoundError("Task"));
    }

    const targetAccessResult = await assertColumnAccess(userId, input.columnId);
    if (targetAccessResult.isErr()) return err(targetAccessResult.error);

    const existingTasksResult = await taskRepository.findByColumn(input.columnId);
    if (existingTasksResult.isErr()) return err(existingTasksResult.error);

    const targetTasks = existingTasksResult.unwrap() ?? [];
    const newPosition = Math.max(0, Math.min(input.position ?? targetTasks.length, targetTasks.length));

    const updateResult = await taskRepository.updateColumnAndPosition(taskId, input.columnId, newPosition);

    if (updateResult.isErr()) {
      return err(new AppError("task-move-failed", `Unable to move task: ${updateResult.error.message}`, 500));
    }

    const normalizedTargetTasks = [
      ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(0, newPosition),
      { ...task[0], columnId: input.columnId },
      ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(newPosition),
    ];
    const targetNormalizeResult = await normalizeTaskPositions(normalizedTargetTasks);

    if (targetNormalizeResult.isErr()) {
      return err(
        new AppError(
          "task-move-failed",
          `Unable to normalize target column: ${targetNormalizeResult.error.message}`,
          500,
        ),
      );
    }

    if (task[0].columnId !== input.columnId) {
      const sourceTasksResult = await taskRepository.findByColumn(task[0].columnId);
      if (sourceTasksResult.isErr()) return err(sourceTasksResult.error);

      const sourceNormalizeResult = await normalizeTaskPositions(
        (sourceTasksResult.unwrap() ?? []).filter((candidate) => candidate.id !== taskId),
      );

      if (sourceNormalizeResult.isErr()) {
        return err(
          new AppError(
            "task-move-failed",
            `Unable to normalize source column: ${sourceNormalizeResult.error.message}`,
            500,
          ),
        );
      }
    }

    return ok({
      id: task[0].id,
      columnId: input.columnId,
      position: newPosition,
    });
  }
}
