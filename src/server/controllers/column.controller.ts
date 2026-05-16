import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import { validate } from "@/server/lib/validate";
import type { ServerVariables } from "@/server/types/server-type";
import {
  CreateColumnUseCase,
  DeleteColumnUseCase,
  ListColumnsUseCase,
  ReorderColumnsUseCase,
  UpdateColumnUseCase,
} from "@/server/use-cases/column";
import { CreateColumnInput, ReorderColumnsInput, UpdateColumnInput } from "@/server/use-cases/column/dto";

export const columnController = new Hono<ServerVariables>()
  .get("/:projectId/columns", guard(), async (c) => {
    const projectId = c.req.param("projectId");
    const currentUser = c.get("user");
    const result = await ListColumnsUseCase.execute(currentUser.id, projectId);

    return result.match({
      ok: (columns) => c.json({ columns }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .post("/:projectId/columns", guard(), validate("json", CreateColumnInput), async (c) => {
    const projectId = c.req.param("projectId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await CreateColumnUseCase.execute(currentUser.id, projectId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:projectId/columns/reorder", guard(), validate("json", ReorderColumnsInput), async (c) => {
    const projectId = c.req.param("projectId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await ReorderColumnsUseCase.execute(currentUser.id, projectId, body.columnIds);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .patch("/:projectId/columns/:columnId", guard(), validate("json", UpdateColumnInput), async (c) => {
    const projectId = c.req.param("projectId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");
    const result = await UpdateColumnUseCase.execute(currentUser.id, projectId, columnId, body);

    return result.match({
      ok: (column) => c.json(column),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })
  .delete("/:projectId/columns/:columnId", guard(), async (c) => {
    const projectId = c.req.param("projectId");
    const columnId = c.req.param("columnId");
    const currentUser = c.get("user");
    const result = await DeleteColumnUseCase.execute(currentUser.id, projectId, columnId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
