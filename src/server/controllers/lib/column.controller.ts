import { Hono } from "hono";
import { guard, validate } from "@/server/lib";
import type { ServerVariables } from "@/server/types";
import {
  CreateColumnUseCase,
  DeleteColumnUseCase,
  ListColumnsUseCase,
  ReorderColumnsUseCase,
  UpdateColumnUseCase,
} from "@/server/use-cases/column";
import { CreateColumnInput, ReorderColumnsInput, UpdateColumnInput } from "@/server/use-cases/column/dto";

export const columnController = new Hono<ServerVariables>()
  .get("/:id/boards/:boardId/columns", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const result = await ListColumnsUseCase.execute(currentUser.id, projectId, boardId);

    return result.match({
      ok: (columns) => c.json({ columns }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .post("/:id/boards/:boardId/columns", guard(), validate("json", CreateColumnInput), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await CreateColumnUseCase.execute(currentUser.id, projectId, boardId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:id/boards/:boardId/columns/reorder", guard(), validate("json", ReorderColumnsInput), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await ReorderColumnsUseCase.execute(currentUser.id, projectId, boardId, body.columnIds);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:id/boards/:boardId/columns/:columnId", guard(), validate("json", UpdateColumnInput), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await UpdateColumnUseCase.execute(currentUser.id, projectId, boardId, columnId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .delete("/:id/boards/:boardId/columns/:columnId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const result = await DeleteColumnUseCase.execute(currentUser.id, projectId, boardId, columnId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
