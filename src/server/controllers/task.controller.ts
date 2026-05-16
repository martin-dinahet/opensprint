import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import { validate } from "@/server/lib/validate";
import type { ServerVariables } from "@/server/types/server-type";
import {
  AssignTaskUseCase,
  CreateTaskUseCase,
  DeleteTaskUseCase,
  ListTasksUseCase,
  MoveTaskUseCase,
  ReorderTaskUseCase,
  UpdateTaskUseCase,
} from "@/server/use-cases/task";
import {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  UpdateTaskInput,
} from "@/server/use-cases/task/dto";

const CreateTaskSchema = CreateTaskInput;
const UpdateTaskSchema = UpdateTaskInput;
const AssignTaskSchema = AssignTaskInput;
const MoveTaskSchema = MoveTaskInput;
const ReorderTaskSchema = ReorderTaskInput;

export const taskController = new Hono<ServerVariables>() //
  .get("/:columnId/tasks", guard(), async (c) => {
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");

    const result = await ListTasksUseCase.execute(currentUser.id, columnId);

    return result.match({
      ok: (tasks) => c.json({ tasks }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:columnId/tasks", guard(), validate("json", CreateTaskSchema), async (c) => {
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await CreateTaskUseCase.execute(currentUser.id, columnId, body);

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

    const result = await UpdateTaskUseCase.execute(currentUser.id, columnId, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:columnId/tasks/:taskId", guard(), async (c) => {
    const columnId = c.req.param("columnId");
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");

    const result = await DeleteTaskUseCase.execute(currentUser.id, columnId, taskId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });

export const taskManagementController = new Hono<ServerVariables>() //
  .patch("/:taskId/assign", guard(), validate("json", AssignTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await AssignTaskUseCase.execute(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:taskId/move", guard(), validate("json", MoveTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await MoveTaskUseCase.execute(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:taskId/reorder", guard(), validate("json", ReorderTaskSchema), async (c) => {
    const taskId = c.req.param("taskId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await ReorderTaskUseCase.execute(currentUser.id, taskId, body);

    return result.match({
      ok: (task) => c.json(task),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
