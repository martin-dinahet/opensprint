import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { AppError } from "@/server/lib/errors";
import { memberRepository } from "@/server/repositories/member.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import type { CreateProjectInput } from "./dto";

export class CreateProjectUseCase {
  static async execute(userId: string, input: CreateProjectInput) {
    const projectId = nanoid();
    const memberId = nanoid();

    const projectResult = await projectRepository.create({
      id: projectId,
      name: input.name,
      description: input.description,
    });

    if (projectResult.isErr()) {
      return err(
        new AppError("project-create-failed", `Unable to create project: ${projectResult.error.message}`, 500),
      );
    }

    const memberResult = await memberRepository.create({
      id: memberId,
      projectId,
      userId,
      role: "owner",
    });

    if (memberResult.isErr()) {
      return err(new AppError("member-create-failed", `Unable to create member: ${memberResult.error.message}`, 500));
    }

    return ok({
      id: projectId,
      name: input.name,
      description: input.description || null,
    });
  }
}
