import { err, ok } from "@punpun-dev/ts-result";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { columnRepository } from "@/server/repositories/column.repository";
import type { UpdateColumnInput } from "./dto";
import { assertProjectAccess } from "./project-access";

export class UpdateColumnUseCase {
  static async execute(userId: string, projectId: string, columnId: string, input: UpdateColumnInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const columnResult = await columnRepository.findById(columnId);
    if (columnResult.isErr()) return err(columnResult.error);

    const column = columnResult.unwrap();
    if (!column || column.length === 0 || column[0].projectId !== projectId) return err(new NotFoundError("Column"));

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
      projectId: updatedColumn[0].projectId,
      name: updatedColumn[0].name,
      position: updatedColumn[0].position,
      updatedAt: updatedColumn[0].updatedAt,
    });
  }
}
