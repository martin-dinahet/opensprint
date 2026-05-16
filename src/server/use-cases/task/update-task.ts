import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertColumnAccess } from "./column-access";
import type { UpdateTaskInput } from "./dto";

export class UpdateTaskUseCase {
  static async execute(userId: string, columnId: string, taskId: string, input: UpdateTaskInput) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);

    const taskResult = await taskRepository.findById(taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const task = taskResult.unwrap();
    if (!task || task.length === 0) {
      return err(new NotFoundError("Task"));
    }

    const updateResult = await taskRepository.update(taskId, input);

    if (updateResult.isErr()) {
      return err(new AppError("task-update-failed", `Unable to update task: ${updateResult.error.message}`, 500));
    }

    const updatedTaskResult = await taskRepository.findById(taskId);
    if (updatedTaskResult.isErr()) return err(updatedTaskResult.error);

    const updatedTask = updatedTaskResult.unwrap();
    if (!updatedTask || updatedTask.length === 0) {
      return err(new AppError("task-fetch-failed", "Unable to fetch updated task", 500));
    }

    return ok({
      id: updatedTask[0].id,
      columnId: updatedTask[0].columnId,
      assigneeId: updatedTask[0].assigneeId,
      title: updatedTask[0].title,
      description: updatedTask[0].description,
      priority: updatedTask[0].priority,
      position: updatedTask[0].position,
      dueDate: updatedTask[0].dueDate,
      updatedAt: updatedTask[0].updatedAt,
    });
  }
}
