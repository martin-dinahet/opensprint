import { and, eq, inArray } from "drizzle-orm";
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

/**
 * GET /api/projects
 * Lists all projects the current user is a member of.
 *
 * Expects:
 *   - Auth: Required (via cookie)
 *
 * Returns:
 *   200: { projects: Array<{ id, name, description, createdAt, updatedAt }> }
 *   401: { success: false, errors: { root: "Not authenticated" } }
 */
export const projectRoute = new Hono<ServerVariables>() //
  .get("/", guard(), async (c) => {
    const currentUser = c.get("user");

    // Find all project memberships for the current user
    const { data: memberships, error: membershipError } = await handle(
      db.select().from(projectMember).where(eq(projectMember.userId, currentUser.id)),
    );
    if (membershipError) {
      console.error(`unable to find projects: ${membershipError}`);
      return c.json({ success: false, errors: { root: "Unable to fetch projects" } }, 500);
    }
    if (!memberships || memberships.length === 0) {
      return c.json({ projects: [] });
    }

    // Get all projects by their IDs
    const projectIds = memberships.map((m) => m.projectId);
    const { data: projects, error: projectsError } = await handle(
      db.select().from(project).where(inArray(project.id, projectIds)),
    );
    if (projectsError) {
      console.error(`unable to fetch project details: ${projectsError}`);
      return c.json({ success: false, errors: { root: "Unable to fetch projects" } }, 500);
    }

    return c.json({
      projects: (projects || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  })

  /**
   * GET /api/projects/:id
   * Gets a specific project by ID.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID)
   *
   * Returns:
   *   200: { id, name, description, createdAt, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   *   404: { success: false, errors: { root: "Project not found" } }
   */
  .get("/:id", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    // Find the project by ID
    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    // Verify the current user is a member of this project
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

  /**
   * POST /api/projects
   * Creates a new project with the current user as owner.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Body: { name: string (3-130 chars), description?: string (3-800 chars) }
   *
   * Returns:
   *   200: { id, name, description }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   */
  .post("/", guard(), validate("json", CreateProjectSchema), async (c) => {
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const projectId = nanoid();
    const memberId = nanoid();

    // Create the new project
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

    // Add the current user as the owner of the project
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