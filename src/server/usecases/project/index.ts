import { nanoid } from "nanoid";
import { projectRepository } from "@/server/repositories";
import { memberRepository } from "@/server/repositories";
import { NotFoundError, UnauthorizedError } from "../errors";
import type { CreateProjectInput, ProjectListOutput } from "@/server/dto";

export class ListProjectsUseCase {
  async execute(userId: string): Promise<ProjectListOutput[]> {
    const { data: memberships, error: membershipError } = await memberRepository.findByUserId(userId);

    if (membershipError || !memberships || memberships.length === 0) {
      return [];
    }

    const projectIds = memberships.map((m) => m.projectId);
    const { data: projects, error: projectsError } = await projectRepository.findByIds(projectIds);

    if (projectsError || !projects) {
      return [];
    }

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}

export class CreateProjectUseCase {
  async execute(userId: string, input: CreateProjectInput) {
    const projectId = nanoid();
    const memberId = nanoid();

    const { error: projectError } = await projectRepository.create({
      id: projectId,
      name: input.name,
      description: input.description,
    });

    if (projectError) {
      throw new Error(`Unable to create project: ${projectError}`);
    }

    const { error: memberError } = await memberRepository.create({
      id: memberId,
      projectId,
      userId,
      role: "owner",
    });

    if (memberError) {
      throw new Error(`Unable to create project member: ${memberError}`);
    }

    return {
      id: projectId,
      name: input.name,
      description: input.description || null,
    };
  }
}

export class GetProjectUseCase {
  async execute(userId: string, projectId: string) {
    const { data: project, error: projectError } = await projectRepository.findById(projectId);

    if (projectError || !project || project.length === 0) {
      throw new NotFoundError("Project");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    return {
      id: project[0].id,
      name: project[0].name,
      description: project[0].description,
      createdAt: project[0].createdAt,
      updatedAt: project[0].updatedAt,
    };
  }
}

export class UpdateProjectUseCase {
  async execute(userId: string, projectId: string, input: { name?: string; description?: string }) {
    const { data: project, error: projectError } = await projectRepository.findById(projectId);

    if (projectError || !project || project.length === 0) {
      throw new NotFoundError("Project");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (membership[0].role === "member") {
      throw new UnauthorizedError("Not authorized");
    }

    const { error: updateError } = await projectRepository.update(projectId, {
      name: input.name,
      description: input.description,
    });

    if (updateError) {
      throw new Error(`Unable to update project: ${updateError}`);
    }

    const { data: updatedProject } = await projectRepository.findById(projectId);
    const updated = updatedProject?.[0];

    return {
      id: updated?.id,
      name: updated?.name,
      description: updated?.description,
      updatedAt: updated?.updatedAt,
    };
  }
}

export class DeleteProjectUseCase {
  async execute(userId: string, projectId: string) {
    const { data: project, error: projectError } = await projectRepository.findById(projectId);

    if (projectError || !project || project.length === 0) {
      throw new NotFoundError("Project");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (membership[0].role !== "owner") {
      throw new UnauthorizedError("Not authorized");
    }

    await memberRepository.deleteByProject(projectId);
    await projectRepository.delete(projectId);

    return { success: true };
  }
}

export const listProjectsUseCase = new ListProjectsUseCase();
export const createProjectUseCase = new CreateProjectUseCase();
export const getProjectUseCase = new GetProjectUseCase();
export const updateProjectUseCase = new UpdateProjectUseCase();
export const deleteProjectUseCase = new DeleteProjectUseCase();
