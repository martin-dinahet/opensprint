import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { taskRepository } from "@/server/repositories";
import { assertColumnAccess } from "./column-access";
import { buildTaskOutputs } from "./task-output";

export class ListTasksUseCase {
  static async execute(userId: string, columnId: string) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tasksResult = await taskRepository.findByColumn(columnId);

    if (tasksResult.isErr()) {
      return err(new AppError("tasks-fetch-failed", `Unable to fetch tasks: ${tasksResult.error.message}`, 500));
    }

    const outputResult = await buildTaskOutputs(tasksResult.unwrap() || []);
    if (outputResult.isErr()) {
      return err(
        new AppError("tasks-fetch-failed", `Unable to fetch task details: ${outputResult.error.message}`, 500),
      );
    }

    return ok(outputResult.unwrap());
  }
}
