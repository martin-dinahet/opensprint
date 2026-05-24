import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";

const defaultColumnNames = ["Todo", "In Progress", "Done"] as const;

export async function createDefaultBoardColumns(boardId: string) {
  for (const [position, name] of defaultColumnNames.entries()) {
    const result = await columnRepository.create({
      id: nanoid(),
      boardId,
      name,
      position,
    });

    if (result.isErr()) {
      return err(
        new AppError("default-columns-create-failed", `Unable to create default columns: ${result.error.message}`, 500),
      );
    }
  }

  return ok({ success: true });
}
