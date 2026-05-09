import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { boardRepository } from "@/server/features/board/repositories";
import { memberRepository } from "@/server/features/member/repositories";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/features/shared/errors";
import { taskRepository } from "@/server/features/task/repositories";
import type { CreateColumnInput, UpdateColumnInput } from "../dto";
import { columnRepository } from "../repositories";

const getBoardForMember = async (userId: string, boardId: string) => {
  const boardResult = await boardRepository.findById(boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const board = boardResult.unwrap();
  if (!board || board.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, board[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok({ board: board[0], membership: membership[0] });
};

export const listColumns = async (userId: string, boardId: string) => {
  const boardResult = await getBoardForMember(userId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const columnsResult = await columnRepository.findByBoard(boardId);

  if (columnsResult.isErr()) {
    return err(new AppError("columns-fetch-failed", `Unable to fetch columns: ${columnsResult.error.message}`, 500));
  }

  return ok(
    (columnsResult.unwrap() || []).map((c) => ({
      id: c.id,
      boardId: c.boardId,
      name: c.name,
      position: c.position,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  );
};

export const createColumn = async (userId: string, boardId: string, input: CreateColumnInput) => {
  const boardResult = await getBoardForMember(userId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const existingColumnsResult = await columnRepository.findByBoard(boardId);

  if (existingColumnsResult.isErr()) {
    return err(
      new AppError("columns-fetch-failed", `Unable to create column: ${existingColumnsResult.error.message}`, 500),
    );
  }

  const columnId = nanoid();
  const position = existingColumnsResult.unwrap()?.length || 0;

  const createResult = await columnRepository.create({
    id: columnId,
    boardId,
    name: input.name,
    position,
  });

  if (createResult.isErr()) {
    return err(new AppError("column-create-failed", `Unable to create column: ${createResult.error.message}`, 500));
  }

  const newColumnResult = await columnRepository.findById(columnId);
  if (newColumnResult.isErr()) return err(newColumnResult.error);

  const newColumn = newColumnResult.unwrap();
  if (!newColumn || newColumn.length === 0) {
    return err(new AppError("column-fetch-failed", "Unable to fetch new column", 500));
  }

  return ok({
    id: newColumn[0].id,
    boardId: newColumn[0].boardId,
    name: newColumn[0].name,
    position: newColumn[0].position,
    createdAt: newColumn[0].createdAt,
    updatedAt: newColumn[0].updatedAt,
  });
};

export const getColumn = async (userId: string, boardId: string, columnId: string) => {
  const boardResult = await getBoardForMember(userId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const columnResult = await columnRepository.findById(columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const column = columnResult.unwrap();
  if (!column || column.length === 0 || column[0].boardId !== boardId) {
    return err(new NotFoundError("Column"));
  }

  return ok({
    id: column[0].id,
    boardId: column[0].boardId,
    name: column[0].name,
    position: column[0].position,
    createdAt: column[0].createdAt,
    updatedAt: column[0].updatedAt,
  });
};

export const updateColumn = async (userId: string, boardId: string, columnId: string, input: UpdateColumnInput) => {
  const columnResult = await getColumn(userId, boardId, columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const updateResult = await columnRepository.update(columnId, input);

  if (updateResult.isErr()) {
    return err(new AppError("column-update-failed", `Unable to update column: ${updateResult.error.message}`, 500));
  }

  const updatedColumnResult = await columnRepository.findById(columnId);
  if (updatedColumnResult.isErr()) return err(updatedColumnResult.error);

  const updatedColumn = updatedColumnResult.unwrap();
  if (!updatedColumn || updatedColumn.length === 0) {
    return err(new AppError("column-fetch-failed", "Unable to fetch updated column", 500));
  }

  return ok({
    id: updatedColumn[0].id,
    boardId: updatedColumn[0].boardId,
    name: updatedColumn[0].name,
    position: updatedColumn[0].position,
    updatedAt: updatedColumn[0].updatedAt,
  });
};

export const deleteColumn = async (userId: string, boardId: string, columnId: string) => {
  const boardResult = await getBoardForMember(userId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  if (boardResult.unwrap().membership.role === "member") {
    return err(new ForbiddenError("Not authorized"));
  }

  const columnResult = await columnRepository.findById(columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const column = columnResult.unwrap();
  if (!column || column.length === 0 || column[0].boardId !== boardId) {
    return err(new NotFoundError("Column"));
  }

  const deleteTasksResult = await taskRepository.deleteByColumn(columnId);

  if (deleteTasksResult.isErr()) {
    return err(
      new AppError(
        "column-tasks-delete-failed",
        `Unable to delete column tasks: ${deleteTasksResult.error.message}`,
        500,
      ),
    );
  }

  const deleteResult = await columnRepository.delete(columnId);

  if (deleteResult.isErr()) {
    return err(new AppError("column-delete-failed", `Unable to delete column: ${deleteResult.error.message}`, 500));
  }

  return ok({ success: true });
};

export const reorderColumns = async (userId: string, boardId: string, columnIds: string[]) => {
  const boardResult = await getBoardForMember(userId, boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const columnsResult = await columnRepository.findByBoard(boardId);
  if (columnsResult.isErr()) return err(columnsResult.error);

  const validColumnIds = new Set(columnsResult.unwrap()?.map((c) => c.id) || []);

  if (columnIds.some((id) => !validColumnIds.has(id))) {
    return err(new NotFoundError("Column"));
  }

  for (let i = 0; i < columnIds.length; i++) {
    const updateResult = await columnRepository.updatePosition(columnIds[i], i);
    if (updateResult.isErr()) {
      return err(
        new AppError("columns-reorder-failed", `Unable to reorder columns: ${updateResult.error.message}`, 500),
      );
    }
  }

  return ok({ success: true });
};
