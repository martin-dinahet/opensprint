import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { CreateTaskInput, UpdateTaskInput, AssignTaskInput, MoveTaskInput, ReorderTaskInput } from "@/server/dto";
import {
  listTasksUseCase,
  createTaskUseCase,
  updateTaskUseCase,
  deleteTaskUseCase,
  assignTaskUseCase,
  moveTaskUseCase,
  reorderTaskUseCase,
} from "@/server/usecases";
import { AppError } from "@/server/usecases/errors";

const CreateTaskSchema = CreateTaskInput;
const UpdateTaskSchema = UpdateTaskInput;
const AssignTaskSchema = AssignTaskInput;
const MoveTaskSchema = MoveTaskInput;
const ReorderTaskSchema = ReorderTaskInput;

export const taskRoute = new Hono<ServerVariables>() //
  .get("/:boardId/tasks", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    try {
      const tasks = await listTasksUseCase.execute(currentUser.id, boardId);
      return c.json({ tasks });
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to fetch tasks: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to fetch tasks" } }, 500);
    }
  })

  .post("/:boardId/tasks", guard(), validate("json", CreateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const task = await createTaskUseCase.execute(currentUser.id, boardId, body);
      return c.json(task);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to create task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to create task" } }, 500);
    }
  })

  .patch("/:boardId/tasks/:taskId", guard(), validate("json", UpdateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const task = await updateTaskUseCase.execute(currentUser.id, boardId, taskId, body);
      return c.json(task);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to update task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to update task" } }, 500);
    }
  })

  .delete("/:boardId/tasks/:taskId", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");

    try {
      const result = await deleteTaskUseCase.execute(currentUser.id, boardId, taskId);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to delete task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to delete task" } }, 500);
    }
  });

export const taskManagementRoute = new Hono<ServerVariables>() //
  .patch("/:taskId/assign", guard(), validate("json", AssignTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const result = await assignTaskUseCase.execute(currentUser.id, taskId, body);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to assign task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to assign task" } }, 500);
    }
  })

  .patch("/:taskId/move", guard(), validate("json", MoveTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const result = await moveTaskUseCase.execute(currentUser.id, taskId, body);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to move task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to move task" } }, 500);
    }
  })

  .patch("/:taskId/reorder", guard(), validate("json", ReorderTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const result = await reorderTaskUseCase.execute(currentUser.id, taskId, body);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to reorder task: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to reorder task" } }, 500);
    }
  });
