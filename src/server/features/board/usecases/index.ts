import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { columnRepository } from "@/server/features/column/repositories";
import { memberRepository } from "@/server/features/member/repositories";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/features/shared/errors";
import { taskRepository } from "@/server/features/task/repositories";
import type { CreateBoardInput, UpdateBoardInput } from "../dto";
import { boardRepository } from "../repositories";

const getProjectMembership = async (userId: string, projectId: string) => {
  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok(membership[0]);
};

export const listBoards = async (userId: string, projectId: string) => {
  const membershipResult = await getProjectMembership(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const boardsResult = await boardRepository.findByProject(projectId);

  if (boardsResult.isErr()) {
    return err(new AppError("boards-fetch-failed", `Unable to fetch boards: ${boardsResult.error.message}`, 500));
  }

  return ok(
    (boardsResult.unwrap() || []).map((b) => ({
      id: b.id,
      projectId: b.projectId,
      name: b.name,
      description: b.description,
      position: b.position,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  );
};

export const createBoard = async (userId: string, projectId: string, input: CreateBoardInput) => {
  const membershipResult = await getProjectMembership(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const existingBoardsResult = await boardRepository.findByProject(projectId);

  if (existingBoardsResult.isErr()) {
    return err(
      new AppError("boards-fetch-failed", `Unable to create board: ${existingBoardsResult.error.message}`, 500),
    );
  }

  const boardId = nanoid();
  const position = existingBoardsResult.unwrap()?.length || 0;

  const createResult = await boardRepository.create({
    id: boardId,
    projectId,
    name: input.name,
    description: input.description,
    position,
  });

  if (createResult.isErr()) {
    return err(new AppError("board-create-failed", `Unable to create board: ${createResult.error.message}`, 500));
  }

  const newBoardResult = await boardRepository.findById(boardId);
  if (newBoardResult.isErr()) return err(newBoardResult.error);

  const newBoard = newBoardResult.unwrap();
  if (!newBoard || newBoard.length === 0) {
    return err(new AppError("board-fetch-failed", "Unable to fetch new board", 500));
  }

  return ok({
    id: newBoard[0].id,
    projectId: newBoard[0].projectId,
    name: newBoard[0].name,
    description: newBoard[0].description,
    position: newBoard[0].position,
    createdAt: newBoard[0].createdAt,
    updatedAt: newBoard[0].updatedAt,
  });
};

export const getBoard = async (userId: string, projectId: string, boardId: string) => {
  const membershipResult = await getProjectMembership(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const boardResult = await boardRepository.findById(boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const board = boardResult.unwrap();
  if (!board || board.length === 0 || board[0].projectId !== projectId) {
    return err(new NotFoundError("Board"));
  }

  return ok({
    id: board[0].id,
    projectId: board[0].projectId,
    name: board[0].name,
    description: board[0].description,
    position: board[0].position,
    createdAt: board[0].createdAt,
    updatedAt: board[0].updatedAt,
  });
};

export const updateBoard = async (userId: string, projectId: string, boardId: string, input: UpdateBoardInput) => {
  const boardResult = await getBoard(userId, projectId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const updateResult = await boardRepository.update(boardId, input);

  if (updateResult.isErr()) {
    return err(new AppError("board-update-failed", `Unable to update board: ${updateResult.error.message}`, 500));
  }

  const updatedBoardResult = await boardRepository.findById(boardId);
  if (updatedBoardResult.isErr()) return err(updatedBoardResult.error);

  const updatedBoard = updatedBoardResult.unwrap();
  if (!updatedBoard || updatedBoard.length === 0) {
    return err(new AppError("board-fetch-failed", "Unable to fetch updated board", 500));
  }

  return ok({
    id: updatedBoard[0].id,
    projectId: updatedBoard[0].projectId,
    name: updatedBoard[0].name,
    description: updatedBoard[0].description,
    position: updatedBoard[0].position,
    updatedAt: updatedBoard[0].updatedAt,
  });
};

export const deleteBoard = async (userId: string, projectId: string, boardId: string) => {
  const membershipResult = await getProjectMembership(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  if (membershipResult.unwrap().role === "member") {
    return err(new ForbiddenError("Not authorized"));
  }

  const boardResult = await getBoard(userId, projectId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const columnsResult = await columnRepository.findByBoard(boardId);
  if (columnsResult.isErr()) return err(columnsResult.error);

  for (const column of columnsResult.unwrap() ?? []) {
    const deleteTasksResult = await taskRepository.deleteByColumn(column.id);

    if (deleteTasksResult.isErr()) {
      return err(
        new AppError(
          "board-tasks-delete-failed",
          `Unable to delete board tasks: ${deleteTasksResult.error.message}`,
          500,
        ),
      );
    }
  }

  const deleteColumnsResult = await columnRepository.deleteByBoard(boardId);

  if (deleteColumnsResult.isErr()) {
    return err(
      new AppError(
        "board-columns-delete-failed",
        `Unable to delete board columns: ${deleteColumnsResult.error.message}`,
        500,
      ),
    );
  }

  const deleteResult = await boardRepository.delete(boardId);

  if (deleteResult.isErr()) {
    return err(new AppError("board-delete-failed", `Unable to delete board: ${deleteResult.error.message}`, 500));
  }

  return ok({ success: true });
};

export const reorderBoards = async (userId: string, projectId: string, boardIds: string[]) => {
  const membershipResult = await getProjectMembership(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const boardsResult = await boardRepository.findByProject(projectId);
  if (boardsResult.isErr()) return err(boardsResult.error);

  const validBoardIds = new Set(boardsResult.unwrap()?.map((b) => b.id) || []);

  if (boardIds.some((id) => !validBoardIds.has(id))) {
    return err(new NotFoundError("Board"));
  }

  for (let i = 0; i < boardIds.length; i++) {
    const updateResult = await boardRepository.updatePosition(boardIds[i], i);
    if (updateResult.isErr()) {
      return err(new AppError("boards-reorder-failed", `Unable to reorder boards: ${updateResult.error.message}`, 500));
    }
  }

  return ok({ success: true });
};
