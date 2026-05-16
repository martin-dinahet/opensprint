import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import type { AppError } from "@/server/lib/errors";
import { taskRepository } from "@/server/repositories/task.repository";

export const normalizeTaskPositions = async (tasks: { id: string }[]): Promise<Result<void, AppError>> => {
  for (let index = 0; index < tasks.length; index++) {
    const updateResult = await taskRepository.updatePosition(tasks[index].id, index);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }
  }

  return ok(undefined);
};

export const insertTaskAtPosition = <T extends { id: string }>(tasks: T[], taskId: string, position: number) => {
  const nextTasks = tasks.filter((candidate) => candidate.id !== taskId);
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) return nextTasks;

  nextTasks.splice(Math.max(0, Math.min(position, nextTasks.length)), 0, task);

  return nextTasks;
};
