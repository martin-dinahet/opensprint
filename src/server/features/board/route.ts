import { Hono } from "hono";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";
import { CreateBoardInput, UpdateBoardInput, ReorderBoardsInput } from "@/server/dto";
import {
  listBoardsUseCase,
  createBoardUseCase,
  getBoardUseCase,
  updateBoardUseCase,
  deleteBoardUseCase,
  reorderBoardsUseCase,
} from "@/server/usecases";
import { AppError } from "@/server/usecases/errors";

const CreateBoardSchema = CreateBoardInput;
const UpdateBoardSchema = UpdateBoardInput;
const ReorderBoardsSchema = ReorderBoardsInput;

export const boardRoute = new Hono<ServerVariables>() //
  .get("/:id/boards", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    try {
      const boards = await listBoardsUseCase.execute(currentUser.id, projectId);
      return c.json({ boards });
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to fetch boards: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to fetch boards" } }, 500);
    }
  })

  .post("/:id/boards", guard(), validate("json", CreateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const board = await createBoardUseCase.execute(currentUser.id, projectId, body);
      return c.json(board);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to create board: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to create board" } }, 500);
    }
  })

  .get("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    try {
      const board = await getBoardUseCase.execute(currentUser.id, projectId, boardId);
      return c.json(board);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to find board: ${error}`);
      return c.json({ success: false, errors: { root: "Board not found" } }, 404);
    }
  })

  .patch("/:id/boards/reorder", guard(), validate("json", ReorderBoardsSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const result = await reorderBoardsUseCase.execute(currentUser.id, projectId, body.boardIds);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to reorder boards: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to reorder boards" } }, 500);
    }
  })

  .patch("/:id/boards/:boardId", guard(), validate("json", UpdateBoardSchema), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");
    const body = c.req.valid("json");

    try {
      const board = await updateBoardUseCase.execute(currentUser.id, projectId, boardId, body);
      return c.json(board);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to update board: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to update board" } }, 500);
    }
  })

  .delete("/:id/boards/:boardId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const boardId = c.req.param("boardId");
    const currentUser = c.get("user");

    try {
      const result = await deleteBoardUseCase.execute(currentUser.id, projectId, boardId);
      return c.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return c.json({ success: false, errors: { root: error.message } }, error.statusCode);
      }
      console.error(`unable to delete board: ${error}`);
      return c.json({ success: false, errors: { root: "Unable to delete board" } }, 500);
    }
  });
