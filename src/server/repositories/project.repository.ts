import { eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { project } from "@/server/db/schema";
import type { CreateProjectInput, UpdateProjectInput } from "@/server/dto";

export class ProjectRepository {
  async findById(id: string) {
    return handle(db.select().from(project).where(eq(project.id, id)));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return { data: [], error: null };
    }
    return handle(db.select().from(project).where(inArray(project.id, ids)));
  }

  async create(data: CreateProjectInput & { id: string }) {
    return handle(
      db.insert(project).values({
        id: data.id,
        name: data.name,
        description: data.description,
      }),
    );
  }

  async update(id: string, data: UpdateProjectInput) {
    return handle(db.update(project).set(data).where(eq(project.id, id)));
  }

  async delete(id: string) {
    return handle(db.delete(project).where(eq(project.id, id)));
  }
}

export const projectRepository = new ProjectRepository();
