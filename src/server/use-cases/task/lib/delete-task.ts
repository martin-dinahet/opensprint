import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError } from "@/server/lib";
import { taskRepository } from "@/server/repositories";
import { assertColumnAccess } from "./column-access";

export class DeleteTaskUseCase {
  static async execute(userId: string, columnId: string, taskId: string) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);
    const { membership } = accessResult.unwrap();

    if (membership.role === "member") {
      return err(new ForbiddenError("Not authorized"));
    }

    const taskResult = await taskRepository.findById(taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const task = taskResult.unwrap();
    if (!task || task.length === 0) {
      return err(new NotFoundError("Task"));
    }
    if (task[0].columnId !== columnId) {
      return err(new NotFoundError("Task"));
    }

    const deleteResult = await taskRepository.delete(taskId);

    if (deleteResult.isErr()) {
      return err(new AppError("task-delete-failed", `Unable to delete task: ${deleteResult.error.message}`, 500));
    }

    return ok({ success: true });
  }
}
