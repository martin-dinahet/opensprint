import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { columnRepository } from "@/server/repositories/column.repository";
import { assertProjectAccess } from "./project-access";

export class ReorderColumnsUseCase {
  static async execute(userId: string, projectId: string, columnIds: string[]) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const columnsResult = await columnRepository.findByProject(projectId);
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
