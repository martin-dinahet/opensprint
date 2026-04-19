import { eq } from "drizzle-orm";
import { type Project, project, type UpdateProject } from "@/db/schema";
import { db } from "@/lib/db";

export async function updateProject(id: string, data: UpdateProject): Promise<Project> {
  const [updated] = await db //
    .update(project)
    .set(data)
    .where(eq(project.id, id))
    .returning();

  if (!updated) throw new Error(`Project not found: ${id}`);
  return updated;
}
