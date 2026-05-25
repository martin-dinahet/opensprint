import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib";
import { columnRepository } from "@/server/repositories";

const defaultColumns = [
  { name: "Backlog", kind: "backlog" },
  { name: "Active", kind: "active", wipLimit: 5 },
  { name: "Review", kind: "review", wipLimit: 3 },
  { name: "Done", kind: "done" },
] as const;

export async function createDefaultBoardColumns(boardId: string) {
  for (const [position, column] of defaultColumns.entries()) {
    const result = await columnRepository.create({
      id: nanoid(),
      boardId,
      name: column.name,
      kind: column.kind,
      wipLimit: "wipLimit" in column ? column.wipLimit : null,
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
