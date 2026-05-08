import type {
  CreateProjectInput,
  ProjectListOutput,
  UpdateProjectInput,
  UpdateProjectOutput,
} from "@/features/project/types";
import { api } from "@/features/shared/api/client";

const BASE_KEY = "projects";

export const projectKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters?: string) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
} as const;

export const projectApi = {
  list: async (): Promise<{ projects: ProjectListOutput[] }> => {
    const res = await api.projects.$get();
    if (!res.ok) {
      throw new Error("Failed to fetch projects");
    }
    const body = await res.json();
    return { projects: body.projects ?? [] };
  },

  get: async (id: string): Promise<ProjectListOutput> => {
    const res = await api.projects[":id"].$get({ param: { id } });
    if (!res.ok) {
      throw new Error("Failed to fetch project");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Project not found");
    }
    return body;
  },

  create: async (data: CreateProjectInput): Promise<{ id: string; name: string; description: string | null }> => {
    const res = await api.projects.$post({ json: data });
    if (!res.ok) {
      throw new Error("Failed to create project");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to create project");
    }
    return body;
  },

  update: async (id: string, data: UpdateProjectInput): Promise<UpdateProjectOutput> => {
    const res = await api.projects[":id"].$patch({ param: { id }, json: data });
    if (!res.ok) {
      throw new Error("Failed to update project");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to update project");
    }
    return body;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].$delete({ param: { id } });
    if (!res.ok) {
      throw new Error("Failed to delete project");
    }
    return res.json() as Promise<{ success: boolean }>;
  },
};
