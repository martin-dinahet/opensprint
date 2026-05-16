import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { memberRepository } from "@/server/repositories/member.repository";
import { taskRepository } from "@/server/repositories/task.repository";
import { assertColumnAccess } from "./column-access";
import type { CreateTaskInput } from "./dto";

export class CreateTaskUseCase {
  static async execute(userId: string, columnId: string, input: CreateTaskInput) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);
    const { column } = accessResult.unwrap();

    if (input.assigneeId) {
      const assigneeResult = await memberRepository.findById(input.assigneeId);
      if (assigneeResult.isErr()) return err(assigneeResult.error);

      const assignee = assigneeResult.unwrap();
      if (!assignee || assignee.length === 0 || assignee[0].projectId !== column.projectId) {
        return err(new NotFoundError("Assignee"));
      }
    }

    const existingTasksResult = await taskRepository.findByColumn(columnId);

    if (existingTasksResult.isErr()) {
      return err(
        new AppError("tasks-fetch-failed", `Unable to create task: ${existingTasksResult.error.message}`, 500),
      );
    }

    const taskId = nanoid();
    const position = existingTasksResult.unwrap()?.length || 0;

    const createResult = await taskRepository.create({
      id: taskId,
      columnId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      position,
    });

    if (createResult.isErr()) {
      return err(new AppError("task-create-failed", `Unable to create task: ${createResult.error.message}`, 500));
    }

    const newTaskResult = await taskRepository.findById(taskId);
    if (newTaskResult.isErr()) return err(newTaskResult.error);

    const newTask = newTaskResult.unwrap();
    if (!newTask || newTask.length === 0) {
      return err(new AppError("task-fetch-failed", "Unable to fetch new task", 500));
    }

    return ok({
      id: newTask[0].id,
      columnId: newTask[0].columnId,
      assigneeId: newTask[0].assigneeId,
      title: newTask[0].title,
      description: newTask[0].description,
      priority: newTask[0].priority,
      position: newTask[0].position,
      dueDate: newTask[0].dueDate,
      createdAt: newTask[0].createdAt,
      updatedAt: newTask[0].updatedAt,
    });
  }
}
