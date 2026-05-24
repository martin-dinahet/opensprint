import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";
import { assertBoardAccess } from "./project-access";

export class ReorderColumnsUseCase {
  static async execute(userId: string, projectId: string, boardId: string, columnIds: string[]) {
    const accessResult = await assertBoardAccess(userId, projectId, boardId);
    if (accessResult.isErr()) return err(accessResult.error);

    const columnsResult = await columnRepository.findByBoard(boardId);
    if (columnsResult.isErr()) return err(columnsResult.error);

    const validColumnIds = new Set(columnsResult.unwrap()?.map((column) => column.id) || []);
    if (columnIds.some((id) => !validColumnIds.has(id))) return err(new NotFoundError("Column"));

    for (let index = 0; index < columnIds.length; index++) {
      const updateResult = await columnRepository.updatePosition(columnIds[index], index);
      if (updateResult.isErr()) {
        return err(
          new AppError("columns-reorder-failed", `Unable to reorder columns: ${updateResult.error.message}`, 500),
        );
      }
    }

    return ok({ success: true });
  }
}
