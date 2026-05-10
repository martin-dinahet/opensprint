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
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateTaskSchema = CreateTaskInput;
const UpdateTaskSchema = UpdateTaskInput;
const AssignTaskSchema = AssignTaskInput;
const MoveTaskSchema = MoveTaskInput;
const ReorderTaskSchema = ReorderTaskInput;

export const taskRoute = new Hono<ServerVariables>() //
  .get("/:columnId/tasks", guard(), async (c) => {
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");

    const result = await listTasks(currentUser.id, columnId);

    return result.match({
      ok: (tasks) => c.json({ tasks }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:columnId/tasks", guard(), validate("json", CreateTaskSchema), async (c) => {
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await createTask(currentUser.id, columnId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:columnId/tasks/:taskId", guard(), validate("json", UpdateTaskSchema), async (c) => {
    const columnId = c.req.param("columnId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await updateTask(currentUser.id, columnId, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:columnId/tasks/:taskId", guard(), async (c) => {
    const columnId = c.req.param("columnId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");

    const result = await deleteTask(currentUser.id, columnId, taskId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });

export const taskManagementRoute = new Hono<ServerVariables>() //
  .patch("/:taskId/assign", guard(), validate("json", AssignTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await assignTask(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:taskId/move", guard(), validate("json", MoveTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await moveTask(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:taskId/reorder", guard(), validate("json", ReorderTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await reorderTask(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
