import { ok } from "@punpun-dev/ts-result";
import { eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { organization } from "@/server/db/schema";
import type { NewProject, ProjectUpdate } from "@/shared";

export class ProjectRepository {
  async findById(id: string) {
    return handle(() => db.select().from(organization).where(eq(organization.id, id)));
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return ok([]);
    }
    return handle(() => db.select().from(organization).where(inArray(organization.id, ids)));
  }

  async create(data: Pick<NewProject, "description" | "id" | "name" | "slug"> & Partial<Pick<NewProject, "status">>) {
    return handle(() =>
      db.insert(organization).values({
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status ?? "active",
      }),
    );
  }

  async update(id: string, data: ProjectUpdate) {
    return handle(() => db.update(organization).set(data).where(eq(organization.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(organization).where(eq(organization.id, id)));
  }
}

export const projectRepository = new ProjectRepository();
