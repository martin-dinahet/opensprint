import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { boardRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";
import { toBoardOutput } from "./board-output";

export class ListBoardsUseCase {
  static async execute(userId: string, projectId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const boardsResult = await boardRepository.findByProject(projectId);
    if (boardsResult.isErr()) {
      return err(new AppError("boards-fetch-failed", `Unable to fetch boards: ${boardsResult.error.message}`, 500));
    }

    return ok((boardsResult.unwrap() ?? []).map(toBoardOutput));
  }
}
