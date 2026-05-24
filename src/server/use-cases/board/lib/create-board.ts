import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib";
import { boardRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";
import type { CreateBoardInput } from "../dto";
import { toBoardOutput } from "./board-output";
import { createDefaultBoardColumns } from "./default-columns";

export class CreateBoardUseCase {
  static async execute(userId: string, projectId: string, input: CreateBoardInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);
    if (accessResult.unwrap().membership.role === "member")
      return err(new AppError("board-create-forbidden", "Not authorized", 403));

    const boardsResult = await boardRepository.findByProject(projectId);
    if (boardsResult.isErr()) {
      return err(new AppError("boards-fetch-failed", `Unable to fetch boards: ${boardsResult.error.message}`, 500));
    }

    const boardId = nanoid();
    const createResult = await boardRepository.create({
      id: boardId,
      projectId,
      name: input.name,
      position: boardsResult.unwrap().length,
    });
    if (createResult.isErr()) {
      return err(new AppError("board-create-failed", `Unable to create board: ${createResult.error.message}`, 500));
    }

    const columnsResult = await createDefaultBoardColumns(boardId);
    if (columnsResult.isErr()) return err(columnsResult.error);

    const boardResult = await boardRepository.findById(boardId);
    if (boardResult.isErr()) return err(boardResult.error);
    const board = boardResult.unwrap()?.[0];
    if (!board) return err(new AppError("board-fetch-failed", "Unable to fetch board", 500));

    return ok(toBoardOutput(board));
  }
}
