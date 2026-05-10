import { Hono } from "hono";
import { CreateColumnInput, ReorderColumnsInput, UpdateColumnInput } from "@/server/features/column/dto";
import {
  createColumn,
  deleteColumn,
  listColumns,
  reorderColumns,
  updateColumn,
} from "@/server/features/column/usecases";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

export const columnRoute = new Hono<ServerVariables>()
  .get("/:boardId/columns", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const result = await listColumns(currentUser.id, boardId);

    return result.match({
      ok: (columns) => c.json({ columns }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .post("/:boardId/columns", guard(), validate("json", CreateColumnInput), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await createColumn(currentUser.id, boardId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:boardId/columns/reorder", guard(), validate("json", ReorderColumnsInput), async (c) => {
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await reorderColumns(currentUser.id, boardId, body.columnIds);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:boardId/columns/:columnId", guard(), validate("json", UpdateColumnInput), async (c) => {
    const boardId = c.req.param("boardId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await updateColumn(currentUser.id, boardId, columnId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .delete("/:boardId/columns/:columnId", guard(), async (c) => {
    const boardId = c.req.param("boardId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const result = await deleteColumn(currentUser.id, boardId, columnId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
