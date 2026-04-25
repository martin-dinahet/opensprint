import { nanoid } from "nanoid";
import { boardRepository } from "@/server/repositories";
import { memberRepository } from "@/server/repositories";
import { NotFoundError, UnauthorizedError, ForbiddenError } from "../errors";
import type { CreateBoardInput, UpdateBoardInput, BoardOutput } from "@/server/dto";

export class ListBoardsUseCase {
  async execute(userId: string, projectId: string): Promise<BoardOutput[]> {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: boards, error: boardsError } = await boardRepository.findByProject(projectId);

    if (boardsError) {
      throw new Error(`Unable to fetch boards: ${boardsError}`);
    }

    return (boards || []).map((b) => ({
      id: b.id,
      projectId: b.projectId,
      name: b.name,
      position: b.position,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
  }
}

export class CreateBoardUseCase {
  async execute(userId: string, projectId: string, input: CreateBoardInput) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: existingBoards, error: boardsError } = await boardRepository.findByProject(projectId);

    if (boardsError) {
      throw new Error(`Unable to create board: ${boardsError}`);
    }

    const boardId = nanoid();
    const position = existingBoards?.length || 0;

    const { error: createError } = await boardRepository.create({
      id: boardId,
      projectId,
      name: input.name,
      position,
    });

    if (createError) {
      throw new Error(`Unable to create board: ${createError}`);
    }

    const { data: newBoard } = await boardRepository.findById(boardId);
    if (!newBoard || newBoard.length === 0) {
      throw new Error("Unable to fetch new board");
    }

    return {
      id: newBoard[0].id,
      projectId: newBoard[0].projectId,
      name: newBoard[0].name,
      position: newBoard[0].position,
      createdAt: newBoard[0].createdAt,
      updatedAt: newBoard[0].updatedAt,
    };
  }
}

export class GetBoardUseCase {
  async execute(userId: string, projectId: string, boardId: string) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    return {
      id: board[0].id,
      projectId: board[0].projectId,
      name: board[0].name,
      position: board[0].position,
      createdAt: board[0].createdAt,
      updatedAt: board[0].updatedAt,
    };
  }
}

export class UpdateBoardUseCase {
  async execute(userId: string, projectId: string, boardId: string, input: UpdateBoardInput) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { error: updateError } = await boardRepository.update(boardId, input);

    if (updateError) {
      throw new Error(`Unable to update board: ${updateError}`);
    }

    const { data: updatedBoard } = await boardRepository.findById(boardId);
    if (!updatedBoard || updatedBoard.length === 0) {
      throw new Error("Unable to fetch updated board");
    }

    return {
      id: updatedBoard[0].id,
      projectId: updatedBoard[0].projectId,
      name: updatedBoard[0].name,
      position: updatedBoard[0].position,
      updatedAt: updatedBoard[0].updatedAt,
    };
  }
}

export class DeleteBoardUseCase {
  async execute(userId: string, projectId: string, boardId: string) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new ForbiddenError("Not authorized");
    }

    if (membership[0].role === "member") {
      throw new ForbiddenError("Not authorized");
    }

    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { error: deleteError } = await boardRepository.delete(boardId);

    if (deleteError) {
      throw new Error(`Unable to delete board: ${deleteError}`);
    }

    return { success: true };
  }
}

export class ReorderBoardsUseCase {
  async execute(userId: string, projectId: string, boardIds: string[]) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: boards } = await boardRepository.findByProject(projectId);
    const validBoardIds = new Set(boards?.map((b) => b.id) || []);

    if (boardIds.some((id) => !validBoardIds.has(id))) {
      throw new NotFoundError("Board");
    }

    for (let i = 0; i < boardIds.length; i++) {
      const { error: updateError } = await boardRepository.updatePosition(boardIds[i], i);
      if (updateError) {
        throw new Error(`Unable to reorder boards: ${updateError}`);
      }
    }

    return { success: true };
  }
}

export const listBoardsUseCase = new ListBoardsUseCase();
export const createBoardUseCase = new CreateBoardUseCase();
export const getBoardUseCase = new GetBoardUseCase();
export const updateBoardUseCase = new UpdateBoardUseCase();
export const deleteBoardUseCase = new DeleteBoardUseCase();
export const reorderBoardsUseCase = new ReorderBoardsUseCase();
