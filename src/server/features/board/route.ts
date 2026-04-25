import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { board, project, projectMember } from "@/server/db/schema";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";

/**
 * GET /api/projects/:id/boards
 * Lists all boards in a project.
 *
 * Expects:
 *   - Auth: Required (via cookie)
 *   - Params: id (project ID)
 *
 * Returns:
 *   200: { boards: Array<{ id, projectId, name, position, createdAt, updatedAt }> }
 *   401: { success: false, errors: { root: "Not authenticated" } }
 *   403: { success: false, errors: { root: "Not a member of this project" } }
 *   404: { success: false, errors: { root: "Project not found" } }
 */
export const boardRoute = new Hono<ServerVariables>() //
  .get("/:id/boards", guard(), async (c) => {
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

    const { data: boards, error: boardsError } = await handle(
      db.select().from(board).where(eq(board.projectId, projectId)),
    );
    if (boardsError) {
      console.error(`unable to fetch boards: ${boardsError}`);
      return c.json({ success: false, errors: { root: "Unable to fetch boards" } }, 500);
    }

    return c.json({
      boards: (boards || []).map((b) => ({
        id: b.id,
        projectId: b.projectId,
        name: b.name,
        position: b.position,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  });
