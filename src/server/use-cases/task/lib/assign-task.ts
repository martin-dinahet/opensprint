import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { memberRepository, taskRepository } from "@/server/repositories";
import type { AssignTaskInput } from "../dto";
import { assertColumnAccess } from "./column-access";

export class AssignTaskUseCase {
  static async execute(userId: string, taskId: string, input: AssignTaskInput) {
    const taskResult = await taskRepository.findById(taskId);
    if (taskResult.isErr()) return err(taskResult.error);

    const task = taskResult.unwrap();
    if (!task || task.length === 0) {
      return err(new NotFoundError("Task"));
    }

    const accessResult = await assertColumnAccess(userId, task[0].columnId);
    if (accessResult.isErr()) return err(accessResult.error);
    const { membership, projectId } = accessResult.unwrap();

    if (membership.role === "member") {
      return err(new UnauthorizedError("Not authorized"));
    }

    if (input.assigneeId) {
      const assigneeResult = await memberRepository.findById(input.assigneeId);
      if (assigneeResult.isErr()) return err(assigneeResult.error);

      const assignee = assigneeResult.unwrap();
      if (!assignee || assignee.length === 0 || assignee[0].organizationId !== projectId) {
        return err(new NotFoundError("Assignee"));
      }
    }

    const updateResult = await taskRepository.updateAssignee(taskId, input.assigneeId);

    if (updateResult.isErr()) {
      return err(new AppError("task-assign-failed", `Unable to assign task: ${updateResult.error.message}`, 500));
    }

    return ok({
      id: task[0].id,
      assigneeId: input.assigneeId,
    });
  }
}
