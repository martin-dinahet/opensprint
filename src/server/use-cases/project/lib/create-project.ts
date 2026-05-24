import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib";
import { boardRepository, memberRepository, projectRepository } from "@/server/repositories";
import { createDefaultBoardColumns } from "@/server/use-cases/board/lib/default-columns";
import type { CreateProjectInput } from "../dto";

const slugifyProjectName = (name: string, id: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "project"}-${id.slice(0, 8)}`;
};

export class CreateProjectUseCase {
  static async execute(userId: string, input: CreateProjectInput) {
    const projectId = nanoid();
    const memberId = nanoid();
    const defaultBoardId = nanoid();

    const projectResult = await projectRepository.create({
      id: projectId,
      name: input.name,
      slug: slugifyProjectName(input.name, projectId),
      description: input.description,
    });

    if (projectResult.isErr()) {
      return err(
        new AppError("project-create-failed", `Unable to create project: ${projectResult.error.message}`, 500),
      );
    }

    const memberResult = await memberRepository.create({
      id: memberId,
      organizationId: projectId,
      userId,
      role: "owner",
    });

    if (memberResult.isErr()) {
      return err(new AppError("member-create-failed", `Unable to create member: ${memberResult.error.message}`, 500));
    }

    const boardResult = await boardRepository.create({
      id: defaultBoardId,
      projectId,
      name: "Board",
      position: 0,
    });
    if (boardResult.isErr()) {
      return err(
        new AppError("board-create-failed", `Unable to create default board: ${boardResult.error.message}`, 500),
      );
    }

    const columnsResult = await createDefaultBoardColumns(defaultBoardId);
    if (columnsResult.isErr()) return err(columnsResult.error);

    return ok({
      id: projectId,
      name: input.name,
      description: input.description || null,
      defaultBoardId,
    });
  }
}
