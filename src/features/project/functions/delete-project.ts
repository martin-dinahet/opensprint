import { eq } from "drizzle-orm";
import { project } from "@/db/schema";
import { db } from "@/lib/db";

export async function deleteProject(id: string): Promise<void> {
  const [deleted] = await db //
    .delete(project)
    .where(eq(project.id, id))
    .returning();
  
  if (!deleted) throw new Error(`Project not found: ${id}`);
}
