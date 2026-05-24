export type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/server/use-cases/project/dto";

import type { Project } from "@/shared";

export type ProjectListOutput = {
  id: Project["id"];
  name: Project["name"];
  description: Exclude<Project["description"], undefined>;
  defaultBoardId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectOutput = ProjectListOutput;

export type CreateProjectOutput = Pick<ProjectListOutput, "defaultBoardId" | "description" | "id" | "name">;

export type UpdateProjectOutput = Pick<ProjectListOutput, "description" | "id" | "name"> & {
  updatedAt: string;
};
