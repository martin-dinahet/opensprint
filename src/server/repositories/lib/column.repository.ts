import { asc, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { column } from "@/server/db/schema";
import type { ColumnUpdate, NewColumn } from "@/shared";

export class ColumnRepository {
  async findById(id: string) {
    return handle(() => db.select().from(column).where(eq(column.id, id)));
  }

  async findByBoard(boardId: string) {
    return handle(() => db.select().from(column).where(eq(column.boardId, boardId)).orderBy(asc(column.position)));
  }

  async create(
    data: Pick<NewColumn, "boardId" | "id" | "name" | "position"> & Partial<Pick<NewColumn, "kind" | "wipLimit">>,
  ) {
    return handle(() =>
      db.insert(column).values({
        id: data.id,
        boardId: data.boardId,
        name: data.name,
        kind: data.kind ?? "custom",
        wipLimit: data.wipLimit ?? null,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: ColumnUpdate) {
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
