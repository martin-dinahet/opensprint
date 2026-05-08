import { Hono } from "hono";
import { CreateBoardInput, ReorderBoardsInput, UpdateBoardInput } from "@/server/features/board/dto";
import {
  createBoard,
  deleteBoard,
  getBoard,
  listBoards,
  reorderBoards,
  updateBoard,
} from "@/server/features/board/usecases";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const CreateBoardSchema = CreateBoardInput;
const UpdateBoardSchema = UpdateBoardInput;
const ReorderBoardsSchema = ReorderBoardsInput;

export const boardRoute = new Hono<ServerVariables>() //
  .get("/:id/boards", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const result = await listBoards(currentUser.id, projectId);

    return result.match({
      ok: (boards) => c.json({ boards }),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .post("/:id/boards", guard(), validate("json", CreateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await createBoard(currentUser.id, projectId, body);

    return result.match({
      ok: (board) => c.json(board),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .get("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    const result = await getBoard(currentUser.id, projectId, boardId);

    return result.match({
      ok: (board) => c.json(board),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id/boards/reorder", guard(), validate("json", ReorderBoardsSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await reorderBoards(currentUser.id, projectId, body.boardIds);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .patch("/:id/boards/:boardId", guard(), validate("json", UpdateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const result = await updateBoard(currentUser.id, projectId, boardId, body);

    return result.match({
      ok: (board) => c.json(board),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  })

  .delete("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    const result = await deleteBoard(currentUser.id, projectId, boardId);

    return result.match({
      ok: (response) => c.json(response),
      err: (error) => c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode }),
    });
  });
