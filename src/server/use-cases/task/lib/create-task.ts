import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, NotFoundError } from "@/server/lib";
import { memberRepository, taskItemRepository, taskRepository, taskTagRepository } from "@/server/repositories";
import type { CreateTaskInput } from "../dto";
import { assertColumnAccess } from "./column-access";
import { buildTaskOutput } from "./task-output";

export class CreateTaskUseCase {
  static async execute(userId: string, columnId: string, input: CreateTaskInput) {
    const accessResult = await assertColumnAccess(userId, columnId);
    if (accessResult.isErr()) return err(accessResult.error);
    const { projectId } = accessResult.unwrap();

    if (input.assigneeId) {
      const assigneeResult = await memberRepository.findById(input.assigneeId);
      if (assigneeResult.isErr()) return err(assigneeResult.error);

      const assignee = assigneeResult.unwrap();
      if (!assignee || assignee.length === 0 || assignee[0].organizationId !== projectId) {
        return err(new NotFoundError("Assignee"));
      }
    }

    const tagIds = [...new Set(input.tagIds ?? [])];
    for (const tagId of tagIds) {
      const tagResult = await taskTagRepository.findProjectTagById(tagId);
      if (tagResult.isErr()) return err(tagResult.error);

      const tags = tagResult.unwrap();
      if (!tags || tags.length === 0 || tags[0].projectId !== projectId) {
        return err(new NotFoundError("Task tag"));
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
      kind: input.kind,
      estimate: input.estimate,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      position,
    });

    if (createResult.isErr()) {
      return err(new AppError("task-create-failed", `Unable to create task: ${createResult.error.message}`, 500));
    }

    for (const [position, item] of (input.items ?? []).entries()) {
      const itemResult = await taskItemRepository.create({
        id: nanoid(),
        taskId,
        title: item.title,
        done: false,
        position,
      });

      if (itemResult.isErr()) {
        return err(
          new AppError("task-item-create-failed", `Unable to create task item: ${itemResult.error.message}`, 500),
        );
      }
    }

    for (const tagId of tagIds) {
      const attachResult = await taskTagRepository.attach(taskId, tagId);
      if (attachResult.isErr()) {
        return err(
          new AppError("task-tag-attach-failed", `Unable to attach task tag: ${attachResult.error.message}`, 500),
        );
      }
    }

    const newTaskResult = await taskRepository.findById(taskId);
    if (newTaskResult.isErr()) return err(newTaskResult.error);

    const newTask = newTaskResult.unwrap();
    if (!newTask || newTask.length === 0) {
      return err(new AppError("task-fetch-failed", "Unable to fetch new task", 500));
    }

    const outputResult = await buildTaskOutput(newTask[0]);
    if (outputResult.isErr()) {
      return err(
        new AppError("task-fetch-failed", `Unable to fetch new task details: ${outputResult.error.message}`, 500),
      );
    }

    return ok(outputResult.unwrap());
  }
}
