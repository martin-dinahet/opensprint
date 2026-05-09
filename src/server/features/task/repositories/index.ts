import { asc, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { task } from "@/server/db/schema";
import type { CreateTaskInput, UpdateTaskInput } from "../dto";

export class TaskRepository {
  async findById(id: string) {
    return handle(() => db.select().from(task).where(eq(task.id, id)));
  }

  async findByBoard(boardId: string) {
    return handle(() => db.select().from(task).where(eq(task.boardId, boardId)).orderBy(asc(task.position)));
  }

  async create(data: CreateTaskInput & { id: string; boardId: string; position: number }) {
    return handle(() =>
      db.insert(task).values({
        id: data.id,
        boardId: data.boardId,
        assigneeId: data.assigneeId || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority || "medium",
        position: data.position,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    );
  }

  async update(id: string, data: UpdateTaskInput) {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return handle(() => db.update(task).set(updateData).where(eq(task.id, id)));
  }

  async updateAssignee(id: string, assigneeId: string | null) {
    return handle(() => db.update(task).set({ assigneeId }).where(eq(task.id, id)));
  }

  async clearAssignee(assigneeId: string) {
    return handle(() => db.update(task).set({ assigneeId: null }).where(eq(task.assigneeId, assigneeId)));
  }

  async updateBoardAndPosition(id: string, boardId: string, position: number) {
    return handle(() => db.update(task).set({ boardId, position }).where(eq(task.id, id)));
  }

  async updatePosition(id: string, position: number) {
    return handle(() => db.update(task).set({ position }).where(eq(task.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(task).where(eq(task.id, id)));
  }

  async deleteByBoard(boardId: string) {
    return handle(() => db.delete(task).where(eq(task.boardId, boardId)));
  }
}

export const taskRepository = new TaskRepository();
