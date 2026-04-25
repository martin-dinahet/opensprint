import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import z from "zod";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { board, project, projectMember } from "@/server/db/schema";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateBoardSchema = z.object({
  name: z.string().min(1).max(130),
});

const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(130).optional(),
  position: z.number().int().min(0).optional(),
});

const ReorderBoardsSchema = z.object({
  boardIds: z.array(z.string()),
});

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

    // Find the project by ID
    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    // Check if user is a member of the project
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get all boards for the project
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
  })

  /**
   * POST /api/projects/:id/boards
   * Creates a new board in a project.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID)
   *   - Body: { name: string (1-130 chars) }
   *
   * Returns:
   *   200: { id, projectId, name, position, createdAt, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   *   404: { success: false, errors: { root: "Project not found" } }
   */
  .post("/:id/boards", guard(), validate("json", CreateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const { name } = c.req.valid("json");

    // Find the project by ID
    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    // Check if user is a member of the project
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get existing boards to determine position
    const { data: existingBoards, error: boardsError } = await handle(
      db.select().from(board).where(eq(board.projectId, projectId)),
    );
    if (boardsError) {
      console.error(`unable to fetch boards: ${boardsError}`);
      return c.json({ success: false, errors: { root: "Unable to create board" } }, 500);
    }

    const boardId = nanoid();
    const position = existingBoards?.length || 0;
    // Create the new board
    const { error: createError } = await handle(
      db.insert(board).values({
        id: boardId,
        projectId,
        name,
        position,
      }),
    );
    if (createError) {
      console.error(`unable to create board: ${createError}`);
      return c.json({ success: false, errors: { root: "Unable to create board" } }, 500);
    }

    // Fetch the newly created board
    const { data: newBoard } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (!newBoard || newBoard.length === 0) {
      console.error(`unable to fetch new board: null`);
      return c.json({ success: false, errors: { root: "Unable to create board" } }, 500);
    }

    return c.json({
      id: newBoard[0].id,
      projectId: newBoard[0].projectId,
      name: newBoard[0].name,
      position: newBoard[0].position,
      createdAt: newBoard[0].createdAt,
      updatedAt: newBoard[0].updatedAt,
    });
  })

  /**
   * GET /api/projects/:id/boards/:boardId
   * Gets a specific board.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID), boardId (board ID)
   *
   * Returns:
   *   200: { id, projectId, name, position, createdAt, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   *   404: { success: false, errors: { root: "Board not found" } }
   */
  .get("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    // Check if user is a member of the project
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    return c.json({
      id: foundBoard[0].id,
      projectId: foundBoard[0].projectId,
      name: foundBoard[0].name,
      position: foundBoard[0].position,
      createdAt: foundBoard[0].createdAt,
      updatedAt: foundBoard[0].updatedAt,
    });
  })

  /**
   * PATCH /api/projects/:id/boards/reorder
   * Reorders boards in a project.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID)
   *   - Body: { boardIds: string[] }
   *
   * Returns:
   *   200: { success: boolean }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .patch("/:id/boards/reorder", guard(), validate("json", ReorderBoardsSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const { boardIds } = c.req.valid("json");

    // Check if user is a member of the project
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get all boards to validate provided IDs
    const { data: boards } = await handle(db.select().from(board).where(eq(board.projectId, projectId)));
    const validBoardIds = boards?.map((b) => b.id) || [];

    if (boardIds.some((id) => !validBoardIds.includes(id))) {
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Update positions for each board
    for (let i = 0; i < boardIds.length; i++) {
      const { error: updateError } = await handle(
        db.update(board).set({ position: i }).where(eq(board.id, boardIds[i])),
      );
      if (updateError) {
        console.error(`unable to reorder boards: ${updateError}`);
        return c.json({ success: false, errors: { root: "Unable to reorder boards" } }, 500);
      }
    }

    return c.json({ success: true });
  })

  /**
   * PATCH /api/projects/:id/boards/:boardId
   * Updates a board's name or position.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID), boardId (board ID)
   *   - Body: { name?: string, position?: number }
   *
   * Returns:
   *   200: { id, projectId, name, position, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   *   404: { success: false, errors: { root: "Board not found" } }
   */
  .patch("/:id/boards/:boardId", guard(), validate("json", UpdateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    // Check if user is a member of the project
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Update the board
    const { error: updateError } = await handle(
      db.update(board).set({ name: body.name, position: body.position }).where(eq(board.id, boardId)),
    );
    if (updateError) {
      console.error(`unable to update board: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to update board" } }, 500);
    }

    // Fetch the updated board
    const { data: updatedBoard } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (!updatedBoard || updatedBoard.length === 0) {
      console.error(`unable to fetch updated board: null`);
      return c.json({ success: false, errors: { root: "Unable to update board" } }, 500);
    }

    return c.json({
      id: updatedBoard[0].id,
      projectId: updatedBoard[0].projectId,
      name: updatedBoard[0].name,
      position: updatedBoard[0].position,
      updatedAt: updatedBoard[0].updatedAt,
    });
  });
