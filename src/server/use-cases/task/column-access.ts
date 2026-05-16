import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import type { Column, Member } from "@/server/db/types";
import { type AppError, NotFoundError, UnauthorizedError } from "@/server/lib/errors";
import { columnRepository } from "@/server/repositories/column.repository";
import { memberRepository } from "@/server/repositories/member.repository";

export const assertColumnAccess = async (
  userId: string,
  columnId: string,
): Promise<Result<{ column: Column; membership: Member }, AppError>> => {
  const columnResult = await columnRepository.findById(columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const columns = columnResult.unwrap();
  if (!columns || columns.length === 0) {
    return err(new NotFoundError("Column"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, columns[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const memberships = membershipResult.unwrap();
  if (!memberships || memberships.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok({ column: columns[0], membership: memberships[0] });
};
