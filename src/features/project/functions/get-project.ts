import { eq } from "drizzle-orm";
import { type Project, project } from "@/db/schema";
import { db } from "@/lib/db";

export async function getProject(id: string): Promise<Project> {
  const [found] = await db //
    .select()
    .from(project)
    .where(eq(project.id, id))
    .limit(1);

  if (!found) throw new Error(`Project not found: ${id}`);
  return found;
}
