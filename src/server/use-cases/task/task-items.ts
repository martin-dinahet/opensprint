import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { taskItemRepository } from "@/server/repositories/task-item.repository";
import type { CreateTaskItemInput, ReorderTaskItemsInput, UpdateTaskItemInput } from "./dto";
import { assertTaskAccess } from "./task-access";

export class CreateTaskItemUseCase {
  static async execute(userId: string, taskId: string, input: CreateTaskItemInput) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const itemsResult = await taskItemRepository.findByTask(taskId);
    if (itemsResult.isErr()) {
      return err(
        new AppError("task-items-fetch-failed", `Unable to fetch task items: ${itemsResult.error.message}`, 500),
      );
    }

    const itemId = nanoid();
    const createResult = await taskItemRepository.create({
      id: itemId,
      taskId,
      title: input.title,
      done: false,
      position: itemsResult.unwrap().length,
    });
    if (createResult.isErr()) {
      return err(
        new AppError("task-item-create-failed", `Unable to create task item: ${createResult.error.message}`, 500),
      );
    }

    const itemResult = await taskItemRepository.findById(itemId);
    if (itemResult.isErr()) return err(itemResult.error);
    const items = itemResult.unwrap();
    if (!items || items.length === 0)
      return err(new AppError("task-item-fetch-failed", "Unable to fetch task item", 500));

    return ok(items[0]);
  }
}

export class UpdateTaskItemUseCase {
  static async execute(userId: string, taskId: string, itemId: string, input: UpdateTaskItemInput) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const itemResult = await taskItemRepository.findById(itemId);
    if (itemResult.isErr()) return err(itemResult.error);
    const items = itemResult.unwrap();
    if (!items || items.length === 0 || items[0].taskId !== taskId) return err(new NotFoundError("Task item"));

    const updateResult = await taskItemRepository.update(itemId, input);
    if (updateResult.isErr()) {
      return err(
        new AppError("task-item-update-failed", `Unable to update task item: ${updateResult.error.message}`, 500),
      );
    }

    const updatedResult = await taskItemRepository.findById(itemId);
    if (updatedResult.isErr()) return err(updatedResult.error);
    const updated = updatedResult.unwrap();
    if (!updated || updated.length === 0)
      return err(new AppError("task-item-fetch-failed", "Unable to fetch task item", 500));

    return ok(updated[0]);
  }
}

export class DeleteTaskItemUseCase {
  static async execute(userId: string, taskId: string, itemId: string) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const itemResult = await taskItemRepository.findById(itemId);
    if (itemResult.isErr()) return err(itemResult.error);
    const items = itemResult.unwrap();
    if (!items || items.length === 0 || items[0].taskId !== taskId) return err(new NotFoundError("Task item"));

    const deleteResult = await taskItemRepository.delete(itemId);
    if (deleteResult.isErr()) {
      return err(
        new AppError("task-item-delete-failed", `Unable to delete task item: ${deleteResult.error.message}`, 500),
      );
    }

    const remainingResult = await taskItemRepository.findByTask(taskId);
    if (remainingResult.isErr()) return err(remainingResult.error);

    for (const [position, item] of remainingResult.unwrap().entries()) {
      const updateResult = await taskItemRepository.updatePosition(item.id, position);
      if (updateResult.isErr()) return err(updateResult.error);
    }

    return ok({ success: true });
  }
}

export class ReorderTaskItemsUseCase {
  static async execute(userId: string, taskId: string, input: ReorderTaskItemsInput) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const itemsResult = await taskItemRepository.findByTask(taskId);
    if (itemsResult.isErr()) return err(itemsResult.error);

    const existingIds = new Set(itemsResult.unwrap().map((item) => item.id));
    if (input.itemIds.length !== existingIds.size || input.itemIds.some((id) => !existingIds.has(id))) {
      return err(new AppError("task-items-reorder-invalid", "Task item order must include every task item", 400));
    }

    for (const [position, itemId] of input.itemIds.entries()) {
      const updateResult = await taskItemRepository.updatePosition(itemId, position);
      if (updateResult.isErr()) return err(updateResult.error);
    }

    const reorderedResult = await taskItemRepository.findByTask(taskId);
    if (reorderedResult.isErr()) return err(reorderedResult.error);

    return ok(reorderedResult.unwrap());
  }
}
