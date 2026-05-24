import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError } from "@/server/lib";
import { boardRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";
import type { UpdateBoardInput } from "../dto";
import { toBoardOutput } from "./board-output";

export class UpdateBoardUseCase {
  static async execute(userId: string, projectId: string, boardId: string, input: UpdateBoardInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);
    if (accessResult.unwrap().membership.role === "member") return err(new ForbiddenError("Not authorized"));

    const boardResult = await boardRepository.findById(boardId);
    if (boardResult.isErr()) return err(boardResult.error);
    const board = boardResult.unwrap()?.[0];
    if (!board || board.projectId !== projectId) return err(new NotFoundError("Board"));

    const updateResult = await boardRepository.update(boardId, input);
    if (updateResult.isErr()) {
      return err(new AppError("board-update-failed", `Unable to update board: ${updateResult.error.message}`, 500));
    }

    const updatedResult = await boardRepository.findById(boardId);
    if (updatedResult.isErr()) return err(updatedResult.error);
    const updated = updatedResult.unwrap()?.[0];
    if (!updated) return err(new NotFoundError("Board"));

    return ok(toBoardOutput(updated));
  }
}
