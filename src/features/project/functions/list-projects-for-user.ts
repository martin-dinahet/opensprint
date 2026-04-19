import { eq } from "drizzle-orm";
import { type Project, project, projectMember } from "@/db/schema";
import { db } from "@/lib/db";

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  const rows = await db //
    .select({ project })
    .from(projectMember)
    .innerJoin(project, eq(projectMember.projectId, project.id))
    .where(eq(projectMember.userId, userId));

  return rows.map((r) => r.project);
}
