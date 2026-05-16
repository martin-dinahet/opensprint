import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertColumnAccess } from "./column-access";
import type { UpdateTaskInput } from "./dto";
import { buildTaskOutput } from "./task-output";

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

    const outputResult = await buildTaskOutput(updatedTask[0]);
    if (outputResult.isErr()) {
      return err(
        new AppError("task-fetch-failed", `Unable to fetch updated task details: ${outputResult.error.message}`, 500),
      );
    }

    return ok(outputResult.unwrap());
  }
}
