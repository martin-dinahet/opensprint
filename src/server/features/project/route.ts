import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import z from "zod";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { project, projectMember } from "@/server/db/schema";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateProjectSchema = z.object({
  name: z.string().min(3).max(130),
  description: z.string().min(3).max(800).optional(),
});

export const projectRoute = new Hono<ServerVariables>() //
  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    return c.json({
      id: foundProject[0].id,
      name: foundProject[0].name,
      description: foundProject[0].description,
      createdAt: foundProject[0].createdAt,
      updatedAt: foundProject[0].updatedAt,
    });
  })
  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const projectId = nanoid();
    const memberId = nanoid();

    // creating the project
    const { error: newProjectError } = await handle(
      db.insert(project).values({
        id: projectId,
        name: body.name,
        description: body.description,
      }),
    );
    if (newProjectError) {
      console.error(`unable to create new project: ${newProjectError}`);
      throw new Error(`unable to create new project: ${newProjectError}`);
    }

    // creating the owner user for the current user
    const { error: newProjectMemberError } = await handle(
      db.insert(projectMember).values({
        id: memberId,
        projectId,
        userId: currentUser.id,
        role: "owner",
      }),
    );
    if (newProjectMemberError) {
      console.error(`unable to create new project member: ${newProjectMemberError}`);
      throw new Error(`unable to create new project member: ${newProjectMemberError}`);
    }

    return c.json({ id: projectId, name: body.name, description: body.description });
  });
