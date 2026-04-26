import { api } from "@/lib/api";
import type { ProjectListOutput } from "@/lib/types";

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
    return res.json() as Promise<{ projects: ProjectListOutput[] }>;
  },

  get: async (id: string): Promise<ProjectListOutput> => {
    const res = await api.projects[":id"].$get({ param: { id } });
    if (!res.ok) {
      throw new Error("Failed to fetch project");
    }
    return res.json() as Promise<ProjectListOutput>;
  },

  create: async (data: {
    name: string;
    description?: string;
  }): Promise<{ id: string; name: string; description: string | null }> => {
    const res = await api.projects.$post({ json: data });
    if (!res.ok) {
      throw new Error("Failed to create project");
    }
    return res.json() as Promise<{ id: string; name: string; description: string | null }>;
  },

  update: async (id: string, data: { name?: string; description?: string }): Promise<ProjectListOutput> => {
    const res = await api.projects[":id"].$patch({ param: { id }, json: data });
    if (!res.ok) {
      throw new Error("Failed to update project");
    }
    return res.json() as Promise<ProjectListOutput>;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].$delete({ param: { id } });
    if (!res.ok) {
      throw new Error("Failed to delete project");
    }
    return res.json() as Promise<{ success: boolean }>;
  },
};
