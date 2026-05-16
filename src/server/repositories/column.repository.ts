import { asc, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { column } from "@/server/db/schema";
import type { CreateColumnInput, UpdateColumnInput } from "@/server/use-cases/column/dto";

export class ColumnRepository {
  async findById(id: string) {
    return handle(() => db.select().from(column).where(eq(column.id, id)));
  }

  async findByProject(projectId: string) {
    return handle(() => db.select().from(column).where(eq(column.projectId, projectId)).orderBy(asc(column.position)));
  }

  async create(data: CreateColumnInput & { id: string; projectId: string; position: number }) {
    return handle(() =>
      db.insert(column).values({
        id: data.id,
        projectId: data.projectId,
        name: data.name,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: UpdateColumnInput) {
    return handle(() => db.update(column).set(data).where(eq(column.id, id)));
  }

  async updatePosition(id: string, position: number) {
    return handle(() => db.update(column).set({ position }).where(eq(column.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(column).where(eq(column.id, id)));
  }
}

export const columnRepository = new ColumnRepository();
