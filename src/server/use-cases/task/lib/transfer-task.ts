import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ConflictError } from "@/server/lib";
import { taskRepository, taskTagRepository } from "@/server/repositories";
import type { TransferTaskInput } from "../dto";
import { assertColumnAccess } from "./column-access";
import { assertTaskAccess } from "./task-access";
import { normalizeTaskPositions } from "./task-position";

export class TransferTaskUseCase {
  static async execute(userId: string, taskId: string, input: TransferTaskInput) {
    const sourceAccessResult = await assertTaskAccess(userId, taskId);
    if (sourceAccessResult.isErr()) return err(sourceAccessResult.error);

    const sourceAccess = sourceAccessResult.unwrap();
    const targetAccessResult = await assertColumnAccess(userId, input.columnId);
    if (targetAccessResult.isErr()) return err(targetAccessResult.error);

    const targetAccess = targetAccessResult.unwrap();
    if (sourceAccess.projectId === targetAccess.projectId) {
      return err(new ConflictError("Use task move for transfers within the same project"));
    }

    const targetTasksResult = await taskRepository.findByColumn(input.columnId);
    if (targetTasksResult.isErr()) return err(targetTasksResult.error);

    const targetTasks = targetTasksResult.unwrap() ?? [];
    const newPosition = Math.max(0, Math.min(input.position ?? targetTasks.length, targetTasks.length));

    const updateResult = await taskRepository.updateColumnAndPosition(taskId, input.columnId, newPosition);
    if (updateResult.isErr()) {
      return err(new AppError("task-transfer-failed", `Unable to transfer task: ${updateResult.error.message}`, 500));
    }

    const clearAssigneeResult = await taskRepository.updateAssignee(taskId, null);
    if (clearAssigneeResult.isErr()) {
      return err(
        new AppError(
          "task-transfer-failed",
          `Unable to clear task assignee: ${clearAssigneeResult.error.message}`,
          500,
        ),
      );
    }

    const detachTagsResult = await taskTagRepository.detachAll(taskId);
    if (detachTagsResult.isErr()) {
      return err(
        new AppError("task-transfer-failed", `Unable to clear task tags: ${detachTagsResult.error.message}`, 500),
      );
    }

    const normalizedTargetTasks = [
      ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(0, newPosition),
      { ...sourceAccess.task, columnId: input.columnId, assigneeId: null },
      ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(newPosition),
    ];
    const targetNormalizeResult = await normalizeTaskPositions(normalizedTargetTasks);

    if (targetNormalizeResult.isErr()) {
      return err(
        new AppError(
          "task-transfer-failed",
          `Unable to normalize target column: ${targetNormalizeResult.error.message}`,
          500,
        ),
      );
    }

    const sourceTasksResult = await taskRepository.findByColumn(sourceAccess.task.columnId);
    if (sourceTasksResult.isErr()) return err(sourceTasksResult.error);

    const sourceNormalizeResult = await normalizeTaskPositions(
      (sourceTasksResult.unwrap() ?? []).filter((candidate) => candidate.id !== taskId),
    );

    if (sourceNormalizeResult.isErr()) {
      return err(
        new AppError(
          "task-transfer-failed",
          `Unable to normalize source column: ${sourceNormalizeResult.error.message}`,
          500,
        ),
      );
    }

    return ok({
      id: taskId,
      columnId: input.columnId,
      position: newPosition,
    });
  }
}
