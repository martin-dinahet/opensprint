import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import z from "zod";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { board, projectMember, task } from "@/server/db/schema";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(3).max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(3).max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
});

const AssignTaskSchema = z.object({
  assigneeId: z.string().nullable(),
});

const MoveTaskSchema = z.object({
  boardId: z.string(),
  position: z.number().int().min(0).optional(),
});

const ReorderTaskSchema = z.object({
  position: z.number().int().min(0),
});

// Task CRUD under boards
export const taskRoute = new Hono<ServerVariables>() //
  /**
   * GET /api/boards/:boardId/tasks
   * Lists all tasks in a board.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: boardId (board ID)
   *
   * Returns:
   *   200: { tasks: Array<{ id, boardId, assigneeId, title, description, priority, position, dueDate, createdAt, updatedAt }> }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .get("/:boardId/tasks", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is a member of the project
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get all tasks for the board
    const { data: tasks, error: tasksError } = await handle(db.select().from(task).where(eq(task.boardId, boardId)));
    if (tasksError) {
      console.error(`unable to fetch tasks: ${tasksError}`);
      return c.json({ success: false, errors: { root: "Unable to fetch tasks" } }, 500);
    }

    return c.json({
      tasks: (tasks || []).map((t) => ({
        id: t.id,
        boardId: t.boardId,
        assigneeId: t.assigneeId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        position: t.position,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  })

  /**
   * POST /api/boards/:boardId/tasks
   * Creates a new task in a board.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: boardId (board ID)
   *   - Body: { title: string, description?: string, priority?: "low"|"medium"|"high"|"urgent", assigneeId?: string, dueDate?: string }
   *
   * Returns:
   *   200: { id, boardId, assigneeId, title, description, priority, position, dueDate, createdAt, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .post("/:boardId/tasks", guard(), validate("json", CreateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is a member of the project
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get existing tasks to determine position
    const { data: existingTasks, error: tasksError } = await handle(
      db.select().from(task).where(eq(task.boardId, boardId)),
    );
    if (tasksError) {
      console.error(`unable to fetch tasks: ${tasksError}`);
      return c.json({ success: false, errors: { root: "Unable to create task" } }, 500);
    }

    // Validate assignee if provided
    if (body.assigneeId) {
      const { data: assignee } = await handle(
        db.select().from(projectMember).where(eq(projectMember.id, body.assigneeId)),
      );
      if (!assignee || assignee.length === 0 || assignee[0].projectId !== projectId) {
        return c.json({ success: false, errors: { root: "Assignee not found" } }, 404);
      }
    }

    const taskId = nanoid();
    const position = existingTasks?.length || 0;
    // Create the new task
    const { error: createError } = await handle(
      db.insert(task).values({
        id: taskId,
        boardId,
        assigneeId: body.assigneeId || null,
        title: body.title,
        description: body.description || null,
        priority: body.priority || "medium",
        position,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
    );
    if (createError) {
      console.error(`unable to create task: ${createError}`);
      return c.json({ success: false, errors: { root: "Unable to create task" } }, 500);
    }

    // Fetch the newly created task
    const { data: newTask } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (!newTask || newTask.length === 0) {
      console.error(`unable to fetch new task: null`);
      return c.json({ success: false, errors: { root: "Unable to create task" } }, 500);
    }

    return c.json({
      id: newTask[0].id,
      boardId: newTask[0].boardId,
      assigneeId: newTask[0].assigneeId,
      title: newTask[0].title,
      description: newTask[0].description,
      priority: newTask[0].priority,
      position: newTask[0].position,
      dueDate: newTask[0].dueDate,
      createdAt: newTask[0].createdAt,
      updatedAt: newTask[0].updatedAt,
    });
  })

  /**
   * PATCH /api/boards/:boardId/tasks/:taskId
   * Updates a task.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: boardId (board ID), taskId (task ID)
   *   - Body: { title?: string, description?: string, priority?: "low"|"medium"|"high"|"urgent", dueDate?: string|null }
   *
   * Returns:
   *   200: { id, boardId, assigneeId, title, description, priority, position, dueDate, updatedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .patch("/:boardId/tasks/:taskId", guard(), validate("json", UpdateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is a member of the project
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Find the task by ID
    const { data: foundTask, error: taskError } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (taskError || !foundTask || foundTask.length === 0) {
      console.error(`unable to find task: ${taskError}`);
      return c.json({ success: false, errors: { root: "Task not found" } }, 404);
    }

    // Update the task
    const { error: updateError } = await handle(
      db
        .update(task)
        .set({
          title: body.title,
          description: body.description,
          priority: body.priority,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        })
        .where(eq(task.id, taskId)),
    );
    if (updateError) {
      console.error(`unable to update task: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to update task" } }, 500);
    }

    // Fetch the updated task
    const { data: updatedTask } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (!updatedTask || updatedTask.length === 0) {
      console.error(`unable to fetch updated task: null`);
      return c.json({ success: false, errors: { root: "Unable to update task" } }, 500);
    }

    return c.json({
      id: updatedTask[0].id,
      boardId: updatedTask[0].boardId,
      assigneeId: updatedTask[0].assigneeId,
      title: updatedTask[0].title,
      description: updatedTask[0].description,
      priority: updatedTask[0].priority,
      position: updatedTask[0].position,
      dueDate: updatedTask[0].dueDate,
      updatedAt: updatedTask[0].updatedAt,
    });
  })

  /**
   * DELETE /api/boards/:boardId/tasks/:taskId
   * Deletes a task.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: boardId (board ID), taskId (task ID)
   *
   * Returns:
   *   200: { success: boolean }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not authorized" } }
   */
  .delete("/:boardId/tasks/:taskId", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");

    // Find the board by ID
    const { data: foundBoard, error: boardError } = await handle(db.select().from(board).where(eq(board.id, boardId)));
    if (boardError || !foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: ${boardError}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is owner or admin
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }
    if (membership[0].role === "member") {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }

    // Find the task by ID
    const { data: foundTask, error: taskError } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (taskError || !foundTask || foundTask.length === 0) {
      console.error(`unable to find task: ${taskError}`);
      return c.json({ success: false, errors: { root: "Task not found" } }, 404);
    }

    // Delete the task
    const { error: deleteError } = await handle(db.delete(task).where(eq(task.id, taskId)));
    if (deleteError) {
      console.error(`unable to delete task: ${deleteError}`);
      return c.json({ success: false, errors: { root: "Unable to delete task" } }, 500);
    }

    return c.json({ success: true });
  });

// Task assignments and moves (not under boards)
export const taskManagementRoute = new Hono<ServerVariables>() //
  /**
   * PATCH /api/tasks/:taskId/assign
   * Assigns a task to a project member.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: taskId (task ID)
   *   - Body: { assigneeId: string|null }
   *
   * Returns:
   *   200: { id, assigneeId }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not authorized" } }
   */
  .patch("/:taskId/assign", guard(), validate("json", AssignTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const { assigneeId } = c.req.valid("json");

    // Find the task by ID
    const { data: foundTask, error: taskError } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (taskError || !foundTask || foundTask.length === 0) {
      console.error(`unable to find task: ${taskError}`);
      return c.json({ success: false, errors: { root: "Task not found" } }, 404);
    }

    // Find the board to get projectId
    const { data: foundBoard } = await handle(db.select().from(board).where(eq(board.id, foundTask[0].boardId)));
    if (!foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: null`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is owner or admin
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }
    if (membership[0].role === "member") {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }

    // Validate assignee if provided
    if (assigneeId) {
      const { data: assignee } = await handle(db.select().from(projectMember).where(eq(projectMember.id, assigneeId)));
      if (!assignee || assignee.length === 0 || assignee[0].projectId !== projectId) {
        return c.json({ success: false, errors: { root: "Assignee not found" } }, 404);
      }
    }

    // Update the task assignee
    const { error: updateError } = await handle(
      db
        .update(task)
        .set({ assigneeId: assigneeId || null })
        .where(eq(task.id, taskId)),
    );
    if (updateError) {
      console.error(`unable to assign task: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to assign task" } }, 500);
    }

    return c.json({
      id: foundTask[0].id,
      assigneeId: assigneeId || null,
    });
  })

  /**
   * PATCH /api/tasks/:taskId/move
   * Moves a task to a different board.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: taskId (task ID)
   *   - Body: { boardId: string, position?: number }
   *
   * Returns:
   *   200: { id, boardId, position }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .patch("/:taskId/move", guard(), validate("json", MoveTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const { boardId: newBoardId, position } = c.req.valid("json");

    // Find the task by ID
    const { data: foundTask, error: taskError } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (taskError || !foundTask || foundTask.length === 0) {
      console.error(`unable to find task: ${taskError}`);
      return c.json({ success: false, errors: { root: "Task not found" } }, 404);
    }

    // Find the target board
    const { data: targetBoard, error: boardError } = await handle(
      db.select().from(board).where(eq(board.id, newBoardId)),
    );
    if (boardError || !targetBoard || targetBoard.length === 0) {
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is a member of the project
    const projectId = targetBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Get tasks in target board to determine position
    const { data: existingTasks } = await handle(db.select().from(task).where(eq(task.boardId, newBoardId)));
    const newPosition = position ?? (existingTasks?.length || 0);

    // Update the task
    const { error: updateError } = await handle(
      db.update(task).set({ boardId: newBoardId, position: newPosition }).where(eq(task.id, taskId)),
    );
    if (updateError) {
      console.error(`unable to move task: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to move task" } }, 500);
    }

    return c.json({
      id: foundTask[0].id,
      boardId: newBoardId,
      position: newPosition,
    });
  })

  /**
   * PATCH /api/tasks/:taskId/reorder
   * Reorders a task within a board.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: taskId (task ID)
   *   - Body: { position: number }
   *
   * Returns:
   *   200: { id, position }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not a member of this project" } }
   */
  .patch("/:taskId/reorder", guard(), validate("json", ReorderTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const { position: newPosition } = c.req.valid("json");

    // Find the task by ID
    const { data: foundTask, error: taskError } = await handle(db.select().from(task).where(eq(task.id, taskId)));
    if (taskError || !foundTask || foundTask.length === 0) {
      console.error(`unable to find task: ${taskError}`);
      return c.json({ success: false, errors: { root: "Task not found" } }, 404);
    }

    // Find the board to get projectId
    const { data: foundBoard } = await handle(db.select().from(board).where(eq(board.id, foundTask[0].boardId)));
    if (!foundBoard || foundBoard.length === 0) {
      console.error(`unable to find board: null`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }

    // Check if user is a member of the project
    const projectId = foundBoard[0].projectId;
    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    // Update the task position
    const { error: updateError } = await handle(
      db.update(task).set({ position: newPosition }).where(eq(task.id, taskId)),
    );
    if (updateError) {
      console.error(`unable to reorder task: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to reorder task" } }, 500);
    }

    return c.json({
      id: foundTask[0].id,
      position: newPosition,
    });
  });
