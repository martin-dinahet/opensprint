import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import { type AppError, NotFoundError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";
import type { Column, Member, Task } from "@/shared/types";
import { assertColumnAccess } from "./column-access";

export const assertTaskAccess = async (
  userId: string,
  taskId: string,
): Promise<Result<{ column: Column; membership: Member; task: Task }, AppError>> => {
  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const tasks = taskResult.unwrap();
  if (!tasks || tasks.length === 0) return err(new NotFoundError("Task"));

  const accessResult = await assertColumnAccess(userId, tasks[0].columnId);
  if (accessResult.isErr()) return err(accessResult.error);

  const { column, membership } = accessResult.unwrap();
  return ok({ column, membership, task: tasks[0] });
};
