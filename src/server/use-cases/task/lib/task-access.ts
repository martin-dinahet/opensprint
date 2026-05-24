import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import { type AppError, NotFoundError } from "@/server/lib";
import { taskRepository } from "@/server/repositories";
import type { Board, Column, Member, Task } from "@/shared";
import { assertColumnAccess } from "./column-access";

export const assertTaskAccess = async (
  userId: string,
  taskId: string,
): Promise<Result<{ board: Board; column: Column; membership: Member; projectId: string; task: Task }, AppError>> => {
  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const tasks = taskResult.unwrap();
  if (!tasks || tasks.length === 0) return err(new NotFoundError("Task"));

  const accessResult = await assertColumnAccess(userId, tasks[0].columnId);
  if (accessResult.isErr()) return err(accessResult.error);

  const { board, column, membership, projectId } = accessResult.unwrap();
  return ok({ board, column, membership, projectId, task: tasks[0] });
};
