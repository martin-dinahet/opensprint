import type {
  CreateProjectInput,
  ProjectListOutput,
  UpdateProjectInput,
  UpdateProjectOutput,
} from "@/entities/project";
import { api } from "@/shared/api/client";
import { requestApiResult } from "@/shared/api/result";

const BASE_KEY = "projects";

export const projectKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters?: string) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
} as const;

export const projectApi = {
  list: async () => {
    return requestApiResult<{ projects: ProjectListOutput[] }>(
      () => api.projects.$get(),
      "Failed to fetch projects",
      (body) => ({
        projects: (body as { projects?: ProjectListOutput[] } | null)?.projects ?? [],
      }),
    );
  },

  get: async (id: string) => {
    return requestApiResult<ProjectListOutput>(
      () => api.projects[":id"].$get({ param: { id } }),
      "Failed to fetch project",
    );
  },

  create: async (data: CreateProjectInput) => {
    return requestApiResult<{ id: string; name: string; description: string | null }>(
      () => api.projects.$post({ json: data }),
      "Failed to create project",
    );
  },

  update: async (id: string, data: UpdateProjectInput) => {
    return requestApiResult<UpdateProjectOutput>(
      () => api.projects[":id"].$patch({ param: { id }, json: data }),
      "Failed to update project",
    );
  },

  delete: async (id: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"].$delete({ param: { id } }),
      "Failed to delete project",
    );
  },
};
