import { api } from "@/features/shared/api/client";
import type {
  BoardOutput,
  CreateBoardInput,
  ReorderBoardsInput,
  UpdateBoardInput,
  UpdateBoardOutput,
} from "@/features/board/types";

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
    const body = await res.json();
    return { boards: body.boards ?? [] };
  },

  get: async (projectId: string, boardId: string): Promise<BoardOutput> => {
    const res = await api.projects[":id"].boards[":boardId"].$get({ param: { id: projectId, boardId } });
    if (!res.ok) {
      throw new Error("Failed to fetch board");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Board not found");
    }
    return body;
  },

  create: async (projectId: string, data: CreateBoardInput): Promise<BoardOutput> => {
    const res = await api.projects[":id"].boards.$post({ param: { id: projectId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to create board");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to create board");
    }
    return body;
  },

  update: async (projectId: string, boardId: string, data: UpdateBoardInput): Promise<UpdateBoardOutput> => {
    const res = await api.projects[":id"].boards[":boardId"].$patch({
      param: { id: projectId, boardId },
      json: data,
    });
    if (!res.ok) {
      throw new Error("Failed to update board");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to update board");
    }
    return body;
  },

  delete: async (projectId: string, boardId: string): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].boards[":boardId"].$delete({ param: { id: projectId, boardId } });
    if (!res.ok) {
      throw new Error("Failed to delete board");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  reorder: async (projectId: string, data: ReorderBoardsInput): Promise<{ success: boolean }> => {
    const res = await api.projects[":id"].boards.reorder.$patch({ param: { id: projectId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to reorder boards");
    }
    return res.json() as Promise<{ success: boolean }>;
  },
};
