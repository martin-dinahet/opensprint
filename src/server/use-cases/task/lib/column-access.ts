import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import { type AppError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { boardRepository, columnRepository, memberRepository } from "@/server/repositories";
import type { Board, Column, Member } from "@/shared";

export const assertColumnAccess = async (
  userId: string,
  columnId: string,
): Promise<Result<{ board: Board; column: Column; membership: Member; projectId: string }, AppError>> => {
  const columnResult = await columnRepository.findById(columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const columns = columnResult.unwrap();
  if (!columns || columns.length === 0) {
    return err(new NotFoundError("Column"));
  }

  const boardResult = await boardRepository.findById(columns[0].boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const boards = boardResult.unwrap();
  if (!boards || boards.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, boards[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const memberships = membershipResult.unwrap();
  if (!memberships || memberships.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok({ board: boards[0], column: columns[0], membership: memberships[0], projectId: boards[0].projectId });
};
