import { ok } from "@punpun-dev/ts-result";
import { eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { project } from "@/server/db/schema";
import type { NewProject, ProjectUpdate } from "@/shared";

export class ProjectRepository {
  async findById(id: string) {
    return handle(() => db.select().from(project).where(eq(project.id, id)));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return ok([]);
    }
    return handle(() => db.select().from(project).where(inArray(project.id, ids)));
  }

  async create(data: Pick<NewProject, "description" | "id" | "name">) {
    return handle(() =>
      db.insert(project).values({
        id: data.id,
        name: data.name,
        description: data.description,
      }),
    );
  }

  async update(id: string, data: ProjectUpdate) {
    return handle(() => db.update(project).set(data).where(eq(project.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(project).where(eq(project.id, id)));
  }
}

export const projectRepository = new ProjectRepository();
