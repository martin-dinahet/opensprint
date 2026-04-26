import { api } from "@/lib/api";
import type { BoardOutput } from "@/lib/types";

const BASE_KEY = "boards";

export const boardKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (projectId: string) => [...boardKeys.lists(), projectId] as const,
  details: () => [...boardKeys.all, "detail"] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
} as const;

export const boardApi = {
  list: async (projectId: string): Promise<{ boards: BoardOutput[] }> => {
    const res = await api.projects[":id"].boards.$get({ param: { id: projectId } });
    if (!res.ok) {
      throw new Error("Failed to fetch boards");
    }
    return res.json() as Promise<{ boards: BoardOutput[] }>;
  },

  get: async (projectId: string, boardId: string): Promise<BoardOutput> => {
    const res = await api.projects[":id"].boards[":boardId"].$get({ param: { id: projectId, boardId } });
    if (!res.ok) {
      throw new Error("Failed to fetch board");
    }
    return res.json() as Promise<BoardOutput>;
  },

  create: async (projectId: string, data: { name: string }): Promise<BoardOutput> => {
    const res = await api.projects[":id"].boards.$post({ param: { id: projectId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to create board");
    }
    return res.json() as Promise<BoardOutput>;
  },

  update: async (
    projectId: string,
    boardId: string,
    data: { name?: string; position?: number },
  ): Promise<BoardOutput> => {
    const res = await api.projects[":id"].boards[":boardId"].$patch({
      param: { id: projectId, boardId },
      json: data,
    });
    if (!res.ok) {
      throw new Error("Failed to update board");
    }
    return res.json() as Promise<BoardOutput>;
  },

  delete: async (projectId: string, boardId: string): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].boards[":boardId"].$delete({ param: { id: projectId, boardId } });
    if (!res.ok) {
      throw new Error("Failed to delete board");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  reorder: async (projectId: string, data: { boardIds: string[] }): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].boards.reorder.$patch({ param: { id: projectId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to reorder boards");
    }
    return res.json() as Promise<{ success: boolean }>;
  },
};
