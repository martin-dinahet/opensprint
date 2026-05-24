import { err, ok } from "@punpun-dev/ts-result";
import { NotFoundError } from "@/server/lib";
import { boardRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";
import { toBoardOutput } from "./board-output";

export class GetBoardUseCase {
  static async execute(userId: string, projectId: string, boardId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const boardResult = await boardRepository.findById(boardId);
    if (boardResult.isErr()) return err(boardResult.error);
    const board = boardResult.unwrap()?.[0];
    if (!board || board.projectId !== projectId) return err(new NotFoundError("Board"));

    return ok(toBoardOutput(board));
  }
}
