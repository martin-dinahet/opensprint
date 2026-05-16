export type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/server/use-cases/project/dto";

export type ProjectListOutput = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectOutput = ProjectListOutput;

export type UpdateProjectOutput = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
};
