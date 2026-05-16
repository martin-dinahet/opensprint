import { ok } from "@punpun-dev/ts-result";
import { asc, eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { taskItem } from "@/server/db/schema";
import type { NewTaskItem, TaskItemUpdate } from "@/shared/types";

export class TaskItemRepository {
  async findById(id: string) {
    return handle(() => db.select().from(taskItem).where(eq(taskItem.id, id)));
  }

  async findByTask(taskId: string) {
    return handle(() => db.select().from(taskItem).where(eq(taskItem.taskId, taskId)).orderBy(asc(taskItem.position)));
  }

  async findByTasks(taskIds: string[]) {
    if (taskIds.length === 0) return ok([]);

    return handle(() =>
      db.select().from(taskItem).where(inArray(taskItem.taskId, taskIds)).orderBy(asc(taskItem.position)),
    );
  }

  async create(data: Pick<NewTaskItem, "done" | "id" | "position" | "taskId" | "title">) {
    return handle(() =>
      db.insert(taskItem).values({
        id: data.id,
        taskId: data.taskId,
        title: data.title,
        done: data.done ?? false,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: TaskItemUpdate) {
    return handle(() => db.update(taskItem).set(data).where(eq(taskItem.id, id)));
  }

  async updatePosition(id: string, position: number) {
    return handle(() => db.update(taskItem).set({ position }).where(eq(taskItem.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(taskItem).where(eq(taskItem.id, id)));
  }
}

export const taskItemRepository = new TaskItemRepository();
