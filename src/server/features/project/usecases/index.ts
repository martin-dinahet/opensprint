import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { boardRepository } from "@/server/features/board/repositories";
import { columnRepository } from "@/server/features/column/repositories";
import { memberRepository } from "@/server/features/member/repositories";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/features/shared/errors";
import { taskRepository } from "@/server/features/task/repositories";
import type { CreateProjectInput } from "../dto";
import { projectRepository } from "../repositories";

export const listProjects = async (userId: string) => {
  const membershipsResult = await memberRepository.findByUserId(userId);
  if (membershipsResult.isErr()) return err(membershipsResult.error);

  const memberships = membershipsResult.unwrap();
  if (!memberships || memberships.length === 0) {
    return ok([]);
  }

  const projectIds = memberships.map((m) => m.projectId);
  const projectsResult = await projectRepository.findByIds(projectIds);
  if (projectsResult.isErr()) return err(projectsResult.error);

  const projects = projectsResult.unwrap();

  return ok(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  );
};

export const createProject = async (userId: string, input: CreateProjectInput) => {
  const projectId = nanoid();
  const memberId = nanoid();

  const projectResult = await projectRepository.create({
    id: projectId,
    name: input.name,
    description: input.description,
  });

  if (projectResult.isErr()) {
    return err(new AppError("project-create-failed", `Unable to create project: ${projectResult.error.message}`, 500));
  }

  const memberResult = await memberRepository.create({
    id: memberId,
    projectId,
    userId,
    role: "owner",
  });

  if (memberResult.isErr()) {
    return err(
      new AppError(
        "project-member-create-failed",
        `Unable to create project member: ${memberResult.error.message}`,
        500,
      ),
    );
  }

  return ok({
    id: projectId,
    name: input.name,
    description: input.description || null,
  });
};

export const getProject = async (userId: string, projectId: string) => {
  const projectResult = await projectRepository.findById(projectId);
  if (projectResult.isErr()) return err(projectResult.error);

  const project = projectResult.unwrap();
  if (!project || project.length === 0) {
    return err(new NotFoundError("Project"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok({
    id: project[0].id,
    name: project[0].name,
    description: project[0].description,
    createdAt: project[0].createdAt,
    updatedAt: project[0].updatedAt,
  });
};

export const updateProject = async (
  userId: string,
  projectId: string,
  input: { name?: string; description?: string },
) => {
  const projectResult = await projectRepository.findById(projectId);
  if (projectResult.isErr()) return err(projectResult.error);

  const project = projectResult.unwrap();
  if (!project || project.length === 0) {
    return err(new NotFoundError("Project"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (membership[0].role === "member") {
    return err(new UnauthorizedError("Not authorized"));
  }

  const updateResult = await projectRepository.update(projectId, {
    name: input.name,
    description: input.description,
  });

  if (updateResult.isErr()) {
    return err(new AppError("project-update-failed", `Unable to update project: ${updateResult.error.message}`, 500));
  }

  const updatedProjectResult = await projectRepository.findById(projectId);
  if (updatedProjectResult.isErr()) return err(updatedProjectResult.error);

  const updated = updatedProjectResult.unwrap()?.[0];

  if (!updated) {
    return err(new NotFoundError("Project"));
  }

  return ok({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    updatedAt: updated.updatedAt,
  });
};

export const deleteProject = async (userId: string, projectId: string) => {
  const projectResult = await projectRepository.findById(projectId);
  if (projectResult.isErr()) return err(projectResult.error);

  const project = projectResult.unwrap();
  if (!project || project.length === 0) {
    return err(new NotFoundError("Project"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (membership[0].role !== "owner") {
    return err(new UnauthorizedError("Not authorized"));
  }

  const boardsResult = await boardRepository.findByProject(projectId);
  if (boardsResult.isErr()) return err(boardsResult.error);

  for (const board of boardsResult.unwrap() ?? []) {
    const columnsResult = await columnRepository.findByBoard(board.id);
    if (columnsResult.isErr()) return err(columnsResult.error);

    for (const column of columnsResult.unwrap() ?? []) {
      const deleteTasksResult = await taskRepository.deleteByColumn(column.id);
      if (deleteTasksResult.isErr()) return err(deleteTasksResult.error);
    }

    const deleteColumnsResult = await columnRepository.deleteByBoard(board.id);
    if (deleteColumnsResult.isErr()) return err(deleteColumnsResult.error);

    const deleteBoardResult = await boardRepository.delete(board.id);
    if (deleteBoardResult.isErr()) return err(deleteBoardResult.error);
  }

  const deleteMembersResult = await memberRepository.deleteByProject(projectId);
  if (deleteMembersResult.isErr()) return err(deleteMembersResult.error);

  const deleteProjectResult = await projectRepository.delete(projectId);
  if (deleteProjectResult.isErr()) return err(deleteProjectResult.error);

  return ok({ success: true });
};
