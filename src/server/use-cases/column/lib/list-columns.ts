import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";
import { assertBoardAccess } from "./project-access";

export class ListColumnsUseCase {
  static async execute(userId: string, projectId: string, boardId: string) {
    const accessResult = await assertBoardAccess(userId, projectId, boardId);
    if (accessResult.isErr()) return err(accessResult.error);

    const columnsResult = await columnRepository.findByBoard(boardId);
    if (columnsResult.isErr()) {
      return err(new AppError("columns-fetch-failed", `Unable to fetch columns: ${columnsResult.error.message}`, 500));
    }

    return ok(
      (columnsResult.unwrap() || []).map((column) => ({
        id: column.id,
        projectId,
        boardId: column.boardId,
        name: column.name,
        kind: column.kind,
        wipLimit: column.wipLimit,
        position: column.position,
        createdAt: column.createdAt,
        updatedAt: column.updatedAt,
      })),
    );
  }
}
