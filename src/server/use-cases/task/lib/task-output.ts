import { err, ok } from "@punpun-dev/ts-result";
import type { AppError } from "@/server/lib";
import { taskItemRepository, taskTagRepository } from "@/server/repositories";
import type { ProjectTaskTag, Task, TaskItem } from "@/shared";

type TaskTagRow = ProjectTaskTag & { taskId: string };

const serializeDate = (date: Date) => date;

export type TaskWithDetails = {
  assigneeId: string | null;
  columnId: string;
  createdAt: Date;
  description: string | null;
  dueDate: Date | null;
  id: string;
  items: TaskItem[];
  position: number;
  priority: Task["priority"];
  tags: ProjectTaskTag[];
  title: string;
  updatedAt: Date;
};

export const buildTaskOutputs = async (tasks: Task[]) => {
  const taskIds = tasks.map((task) => task.id);
  const itemsResult = await taskItemRepository.findByTasks(taskIds);
  if (itemsResult.isErr()) return itemsResult;

  const tagsResult = await taskTagRepository.findTagsByTasks(taskIds);
  if (tagsResult.isErr()) return tagsResult;

  const itemsByTask = new Map<string, TaskItem[]>();
  for (const item of itemsResult.unwrap()) {
    itemsByTask.set(item.taskId, [...(itemsByTask.get(item.taskId) ?? []), item]);
  }

  const tagsByTask = new Map<string, ProjectTaskTag[]>();
  for (const tag of tagsResult.unwrap() as TaskTagRow[]) {
    const { taskId: _taskId, ...projectTag } = tag;
    tagsByTask.set(tag.taskId, [...(tagsByTask.get(tag.taskId) ?? []), projectTag]);
  }

  return ok(
    tasks.map((task) => ({
      id: task.id,
      columnId: task.columnId,
      assigneeId: task.assigneeId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      position: task.position,
      dueDate: task.dueDate ? serializeDate(task.dueDate) : null,
      createdAt: serializeDate(task.createdAt),
      updatedAt: serializeDate(task.updatedAt),
      items: itemsByTask.get(task.id) ?? [],
      tags: tagsByTask.get(task.id) ?? [],
    })),
  );
};

export const buildTaskOutput = async (task: Task) => {
  const result = await buildTaskOutputs([task]);
  if (result.isErr()) return err(result.error);

  return ok(result.unwrap()[0]);
};

export type TaskOutputError = AppError | Error;
