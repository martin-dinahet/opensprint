import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";
import type { CreateColumnInput } from "../dto";
import { assertProjectAccess } from "./project-access";

export class CreateColumnUseCase {
  static async execute(userId: string, projectId: string, input: CreateColumnInput) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const existingColumnsResult = await columnRepository.findByProject(projectId);
    if (existingColumnsResult.isErr()) {
      return err(
        new AppError("columns-fetch-failed", `Unable to create column: ${existingColumnsResult.error.message}`, 500),
      );
    }

    const columnId = nanoid();
    const position = existingColumnsResult.unwrap()?.length || 0;
    const createResult = await columnRepository.create({ id: columnId, projectId, name: input.name, position });
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
      projectId: newColumn[0].projectId,
      name: newColumn[0].name,
      position: newColumn[0].position,
      createdAt: newColumn[0].createdAt,
      updatedAt: newColumn[0].updatedAt,
    });
  }
}
