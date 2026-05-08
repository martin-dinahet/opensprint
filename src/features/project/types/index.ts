export type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/server/features/project/dto";

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
