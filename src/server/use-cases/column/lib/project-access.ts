import type { Result } from "@punpun-dev/ts-result";
import { err, ok } from "@punpun-dev/ts-result";
import { type AppError, NotFoundError, UnauthorizedError } from "@/server/lib";
import { memberRepository } from "@/server/repositories";
import { projectRepository } from "@/server/repositories";
import type { Member, Project } from "@/shared";

export const assertProjectAccess = async (
  userId: string,
  projectId: string,
): Promise<Result<{ project: Project; membership: Member }, AppError>> => {
  const projectResult = await projectRepository.findById(projectId);
  if (projectResult.isErr()) return err(projectResult.error);

  const projects = projectResult.unwrap();
  if (!projects || projects.length === 0) return err(new NotFoundError("Project"));

  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const memberships = membershipResult.unwrap();
  if (!memberships || memberships.length === 0) return err(new UnauthorizedError("Not a member of this project"));

  return ok({ project: projects[0], membership: memberships[0] });
};
