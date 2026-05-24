import { err, ok } from "@punpun-dev/ts-result";
import { AppError, ForbiddenError, NotFoundError } from "@/server/lib";
import { boardRepository, columnRepository, taskRepository } from "@/server/repositories";
import { assertProjectAccess } from "@/server/use-cases/column/lib/project-access";

export class DeleteBoardUseCase {
  static async execute(userId: string, projectId: string, boardId: string) {
    const accessResult = await assertProjectAccess(userId, projectId);
    if (accessResult.isErr()) return err(accessResult.error);
    if (accessResult.unwrap().membership.role === "member") return err(new ForbiddenError("Not authorized"));

    const boardResult = await boardRepository.findById(boardId);
    if (boardResult.isErr()) return err(boardResult.error);
    const board = boardResult.unwrap()?.[0];
    if (!board || board.projectId !== projectId) return err(new NotFoundError("Board"));

    const columnsResult = await columnRepository.findByBoard(boardId);
    if (columnsResult.isErr()) return err(columnsResult.error);

    for (const column of columnsResult.unwrap() ?? []) {
      const deleteTasksResult = await taskRepository.deleteByColumn(column.id);
      if (deleteTasksResult.isErr()) {
        return err(
          new AppError(
            "board-tasks-delete-failed",
            `Unable to delete board tasks: ${deleteTasksResult.error.message}`,
            500,
          ),
        );
      }
    }

    const deleteResult = await boardRepository.delete(boardId);
    if (deleteResult.isErr()) {
      return err(new AppError("board-delete-failed", `Unable to delete board: ${deleteResult.error.message}`, 500));
    }

    return ok({ success: true });
  }
}
