import { asc, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { boardColumn } from "@/server/db/schema";
import type { CreateColumnInput, UpdateColumnInput } from "@/server/use-cases/column/dto";

export class ColumnRepository {
  async findById(id: string) {
    return handle(() => db.select().from(boardColumn).where(eq(boardColumn.id, id)));
  }

  async findByBoard(boardId: string) {
    return handle(() =>
      db.select().from(boardColumn).where(eq(boardColumn.boardId, boardId)).orderBy(asc(boardColumn.position)),
    );
  }

  async create(data: CreateColumnInput & { id: string; boardId: string; position: number }) {
    return handle(() =>
      db.insert(boardColumn).values({
        id: data.id,
        boardId: data.boardId,
        name: data.name,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: UpdateColumnInput) {
    return handle(() => db.update(boardColumn).set(data).where(eq(boardColumn.id, id)));
  }

  async updatePosition(id: string, position: number) {
    return handle(() => db.update(boardColumn).set({ position }).where(eq(boardColumn.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(boardColumn).where(eq(boardColumn.id, id)));
  }
}

export const columnRepository = new ColumnRepository();
