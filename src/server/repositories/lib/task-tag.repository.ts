import { ok } from "@punpun-dev/ts-result";
import { and, asc, eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { projectTaskTag, taskTag } from "@/server/db/schema";
import type { NewProjectTaskTag, ProjectTaskTagUpdate } from "@/shared";

export class TaskTagRepository {
  async findProjectTagById(id: string) {
    return handle(() => db.select().from(projectTaskTag).where(eq(projectTaskTag.id, id)));
  }

  async findProjectTags(projectId: string) {
    return handle(() =>
      db.select().from(projectTaskTag).where(eq(projectTaskTag.projectId, projectId)).orderBy(asc(projectTaskTag.name)),
    );
  }

  async createProjectTag(data: Pick<NewProjectTaskTag, "color" | "id" | "name" | "projectId">) {
    return handle(() =>
      db.insert(projectTaskTag).values({
        id: data.id,
        projectId: data.projectId,
        name: data.name,
        color: data.color,
      }),
    );
  }

  async updateProjectTag(id: string, data: ProjectTaskTagUpdate) {
    return handle(() => db.update(projectTaskTag).set(data).where(eq(projectTaskTag.id, id)));
  }

  async deleteProjectTag(id: string) {
    return handle(() => db.delete(projectTaskTag).where(eq(projectTaskTag.id, id)));
  }

  async findTagsByTasks(taskIds: string[]) {
    if (taskIds.length === 0) return ok([]);

    return handle(() =>
      db
        .select({
          taskId: taskTag.taskId,
          id: projectTaskTag.id,
          projectId: projectTaskTag.projectId,
          name: projectTaskTag.name,
          color: projectTaskTag.color,
          createdAt: projectTaskTag.createdAt,
          updatedAt: projectTaskTag.updatedAt,
        })
        .from(taskTag)
        .innerJoin(projectTaskTag, eq(taskTag.tagId, projectTaskTag.id))
        .where(inArray(taskTag.taskId, taskIds))
        .orderBy(asc(projectTaskTag.name)),
    );
  }

  async attach(taskId: string, tagId: string) {
    return handle(() => db.insert(taskTag).values({ taskId, tagId }).onConflictDoNothing());
  }

  async detach(taskId: string, tagId: string) {
    return handle(() => db.delete(taskTag).where(and(eq(taskTag.taskId, taskId), eq(taskTag.tagId, tagId))));
  }
}

export const taskTagRepository = new TaskTagRepository();
