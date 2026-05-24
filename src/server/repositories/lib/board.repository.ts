import { asc, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { board } from "@/server/db/schema";
import type { BoardUpdate, NewBoard } from "@/shared";

export class BoardRepository {
  async findById(id: string) {
    return handle(() => db.select().from(board).where(eq(board.id, id)));
  }

  async findByProject(projectId: string) {
    return handle(() => db.select().from(board).where(eq(board.projectId, projectId)).orderBy(asc(board.position)));
  }

  async create(data: Pick<NewBoard, "id" | "name" | "position" | "projectId">) {
    return handle(() =>
      db.insert(board).values({
        id: data.id,
        projectId: data.projectId,
        name: data.name,
        position: data.position,
      }),
    );
  }

  async update(id: string, data: BoardUpdate) {
    return handle(() => db.update(board).set(data).where(eq(board.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(board).where(eq(board.id, id)));
  }
}

export const boardRepository = new BoardRepository();
