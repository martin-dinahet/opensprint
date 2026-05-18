import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError, NotFoundError } from "@/server/lib";
import { taskTagRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";
import type { AttachTaskTagInput, CreateProjectTaskTagInput, UpdateProjectTaskTagInput } from "../dto";
import { assertTaskAccess } from "./task-access";

export class ListProjectTaskTagsUseCase {
  static async execute(userId: string, projectId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagsResult = await taskTagRepository.findProjectTags(projectId);
    if (tagsResult.isErr()) {
      return err(new AppError("task-tags-fetch-failed", `Unable to fetch task tags: ${tagsResult.error.message}`, 500));
    }

    return ok(tagsResult.unwrap());
  }
}

export class CreateProjectTaskTagUseCase {
  static async execute(userId: string, projectId: string, input: CreateProjectTaskTagInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagId = nanoid();
    const createResult = await taskTagRepository.createProjectTag({
      id: tagId,
      projectId,
      name: input.name,
      color: input.color,
    });
    if (createResult.isErr()) {
      return err(
        new AppError("task-tag-create-failed", `Unable to create task tag: ${createResult.error.message}`, 500),
      );
    }

    const tagResult = await taskTagRepository.findProjectTagById(tagId);
    if (tagResult.isErr()) return err(tagResult.error);
    const tags = tagResult.unwrap();
    if (!tags || tags.length === 0) return err(new AppError("task-tag-fetch-failed", "Unable to fetch task tag", 500));

    return ok(tags[0]);
  }
}

export class UpdateProjectTaskTagUseCase {
  static async execute(userId: string, projectId: string, tagId: string, input: UpdateProjectTaskTagInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagResult = await taskTagRepository.findProjectTagById(tagId);
    if (tagResult.isErr()) return err(tagResult.error);
    const tags = tagResult.unwrap();
    if (!tags || tags.length === 0 || tags[0].projectId !== projectId) return err(new NotFoundError("Task tag"));

    const updateResult = await taskTagRepository.updateProjectTag(tagId, input);
    if (updateResult.isErr()) {
      return err(
        new AppError("task-tag-update-failed", `Unable to update task tag: ${updateResult.error.message}`, 500),
      );
    }

    const updatedResult = await taskTagRepository.findProjectTagById(tagId);
    if (updatedResult.isErr()) return err(updatedResult.error);
    const updated = updatedResult.unwrap();
    if (!updated || updated.length === 0)
      return err(new AppError("task-tag-fetch-failed", "Unable to fetch task tag", 500));

    return ok(updated[0]);
  }
}

export class DeleteProjectTaskTagUseCase {
  static async execute(userId: string, projectId: string, tagId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagResult = await taskTagRepository.findProjectTagById(tagId);
    if (tagResult.isErr()) return err(tagResult.error);
    const tags = tagResult.unwrap();
    if (!tags || tags.length === 0 || tags[0].projectId !== projectId) return err(new NotFoundError("Task tag"));

    const deleteResult = await taskTagRepository.deleteProjectTag(tagId);
    if (deleteResult.isErr()) {
      return err(
        new AppError("task-tag-delete-failed", `Unable to delete task tag: ${deleteResult.error.message}`, 500),
      );
    }

    return ok({ success: true });
  }
}

export class AttachTaskTagUseCase {
  static async execute(userId: string, taskId: string, input: AttachTaskTagInput) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagResult = await taskTagRepository.findProjectTagById(input.tagId);
    if (tagResult.isErr()) return err(tagResult.error);
    const tags = tagResult.unwrap();
    if (!tags || tags.length === 0 || tags[0].projectId !== accessResult.unwrap().column.projectId) {
      return err(new NotFoundError("Task tag"));
    }

    const attachResult = await taskTagRepository.attach(taskId, input.tagId);
    if (attachResult.isErr()) {
      return err(
        new AppError("task-tag-attach-failed", `Unable to attach task tag: ${attachResult.error.message}`, 500),
      );
    }

    return ok(tags[0]);
  }
}

export class DetachTaskTagUseCase {
  static async execute(userId: string, taskId: string, tagId: string) {
    const accessResult = await assertTaskAccess(userId, taskId);
    if (accessResult.isErr()) return err(accessResult.error);

    const tagResult = await taskTagRepository.findProjectTagById(tagId);
    if (tagResult.isErr()) return err(tagResult.error);
    const tags = tagResult.unwrap();
    if (!tags || tags.length === 0 || tags[0].projectId !== accessResult.unwrap().column.projectId) {
      return err(new NotFoundError("Task tag"));
    }

    const detachResult = await taskTagRepository.detach(taskId, tagId);
    if (detachResult.isErr()) {
      return err(
        new AppError("task-tag-detach-failed", `Unable to detach task tag: ${detachResult.error.message}`, 500),
      );
    }

    return ok({ success: true });
  }
}
