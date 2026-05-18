import { err, ok } from "@punpun-dev/ts-result";
import { AppError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";
import { assertProjectAccess } from "./project-access";

export class ListColumnsUseCase {
  static async execute(userId: string, projectId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);

    const columnsResult = await columnRepository.findByProject(projectId);
    if (columnsResult.isErr()) {
      return err(new AppError("columns-fetch-failed", `Unable to fetch columns: ${columnsResult.error.message}`, 500));
    }

    return ok(
      (columnsResult.unwrap() || []).map((column) => ({
        id: column.id,
        projectId: column.projectId,
        name: column.name,
        position: column.position,
        createdAt: column.createdAt,
        updatedAt: column.updatedAt,
      })),
    );
  }
}
