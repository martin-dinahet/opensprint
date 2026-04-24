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
  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const projectId = nanoid();
    const memberId = nanoid();

    // creating the project
    const { error: newProjectError } = await handle(
      db.insert(project).values({
        id: nanoid(),
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
