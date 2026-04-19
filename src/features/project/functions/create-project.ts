import { type CreateProject, type Project, project } from "@/db/schema";
import { db } from "@/lib/db";

export async function createProject(data: CreateProject): Promise<Project> {
  const [created] = await db //
    .insert(project)
    .values(data)
    .returning();
  
  return created;
}
