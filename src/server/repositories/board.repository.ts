import { eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { board } from "@/server/db/schema";
import type { CreateBoardInput, UpdateBoardInput } from "@/server/dto";

export class BoardRepository {
  async findById(id: string) {
    return handle(db.select().from(board).where(eq(board.id, id)));
  }

  async findByProject(projectId: string) {
    return handle(db.select().from(board).where(eq(board.projectId, projectId)));
  }

  async create(data: CreateBoardInput & { id: string; projectId: string; position: number }) {
    return handle(
      db.insert(board).values({
        id: data.id,
        projectId: data.projectId,
        name: data.name,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: UpdateBoardInput) {
    return handle(db.update(board).set(data).where(eq(board.id, id)));
  }

  async updatePosition(id: string, position: number) {
    return handle(db.update(board).set({ position }).where(eq(board.id, id)));
  }

  async delete(id: string) {
    return handle(db.delete(board).where(eq(board.id, id)));
  }
}

export const boardRepository = new BoardRepository();
