import { Hono } from "hono";
import { handleUseCase } from "@/server/lib/handle-use-case";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { CreateBoardInput, ReorderBoardsInput, UpdateBoardInput } from "@/server/features/board/dto";
import { createBoard, deleteBoard, getBoard, listBoards, reorderBoards, updateBoard } from "@/server/features/board/usecases";

const CreateBoardSchema = CreateBoardInput;
const UpdateBoardSchema = UpdateBoardInput;
const ReorderBoardsSchema = ReorderBoardsInput;

export const boardRoute = new Hono<ServerVariables>() //
  .get("/:id/boards", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(listBoards(currentUser.id, projectId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json({ boards: data });
  })

  .post("/:id/boards", guard(), validate("json", CreateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(createBoard(currentUser.id, projectId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .get("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(getBoard(currentUser.id, projectId, boardId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:id/boards/reorder", guard(), validate("json", ReorderBoardsSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(reorderBoards(currentUser.id, projectId, body.boardIds));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .patch("/:id/boards/:boardId", guard(), validate("json", UpdateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await handleUseCase(updateBoard(currentUser.id, projectId, boardId, body));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  })

  .delete("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    const { data, error } = await handleUseCase(deleteBoard(currentUser.id, projectId, boardId));

    if (error) {
      return c.json({ success: false, errors: { root: error.message } }, { status: error.statusCode });
    }

    return c.json(data);
  });