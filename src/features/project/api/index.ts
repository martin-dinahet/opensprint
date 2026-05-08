import type {
  CreateProjectInput,
  ProjectListOutput,
  UpdateProjectInput,
  UpdateProjectOutput,
} from "@/features/project/types";
import { api } from "@/features/shared/api/client";
import { readApiResult } from "@/features/shared/api/result";

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
    const res = await api.projects.$get();
    return readApiResult<{ projects: ProjectListOutput[] }>(res, "Failed to fetch projects", (body) => ({
      projects: (body as { projects?: ProjectListOutput[] } | null)?.projects ?? [],
    }));
  },

  get: async (id: string) => {
    const res = await api.projects[":id"].$get({ param: { id } });
    return readApiResult<ProjectListOutput>(res, "Failed to fetch project");
  },

  create: async (data: CreateProjectInput) => {
    const res = await api.projects.$post({ json: data });
    return readApiResult<{ id: string; name: string; description: string | null }>(res, "Failed to create project");
  },

  update: async (id: string, data: UpdateProjectInput) => {
    const res = await api.projects[":id"].$patch({ param: { id }, json: data });
    return readApiResult<UpdateProjectOutput>(res, "Failed to update project");
  },

  delete: async (id: string) => {
    const res = await api.projects[":id"].$delete({ param: { id } });
    return readApiResult<{ success: boolean }>(res, "Failed to delete project");
  },
};
