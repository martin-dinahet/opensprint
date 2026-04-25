import { Hono } from "hono";
import {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  UpdateTaskInput,
} from "@/server/features/task/dto";
import {
  assignTask,
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  reorderTask,
  updateTask,
} from "@/server/features/task/usecases";
import { guard } from "@/server/lib/guard";
import { handleUseCase } from "@/server/lib/handle-use-case";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateTaskSchema = CreateTaskInput;
const UpdateTaskSchema = UpdateTaskInput;
const AssignTaskSchema = AssignTaskInput;
const MoveTaskSchema = MoveTaskInput;
const ReorderTaskSchema = ReorderTaskInput;

export const taskRoute = new Hono<ServerVariables>() //
  .get("/:boardId/tasks", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(listTasks(currentUser.id, boardId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json({ tasks: data });
  })

  .post("/:boardId/tasks", guard(), validate("json", CreateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(createTask(currentUser.id, boardId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:boardId/tasks/:taskId", guard(), validate("json", UpdateTaskSchema), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(updateTask(currentUser.id, boardId, taskId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .delete("/:boardId/tasks/:taskId", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(deleteTask(currentUser.id, boardId, taskId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  });

export const taskManagementRoute = new Hono<ServerVariables>() //
  .patch("/:taskId/assign", guard(), validate("json", AssignTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(assignTask(currentUser.id, taskId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:taskId/move", guard(), validate("json", MoveTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(moveTask(currentUser.id, taskId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:taskId/reorder", guard(), validate("json", ReorderTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(reorderTask(currentUser.id, taskId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  });
