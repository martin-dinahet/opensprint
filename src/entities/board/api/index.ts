import type {
  BoardOutput,
  CreateBoardInput,
  ReorderBoardsInput,
  UpdateBoardInput,
  UpdateBoardOutput,
} from "@/entities/board";
import { api } from "@/shared/api/client";
import { readApiResult } from "@/shared/api/result";

const BASE_KEY = "boards";

export const boardKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (projectId: string) => [...boardKeys.lists(), projectId] as const,
  details: () => [...boardKeys.all, "detail"] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
} as const;

export const boardApi = {
  list: async (projectId: string) => {
    const res = await api.projects[":id"].boards.$get({ param: { id: projectId } });
    return readApiResult<{ boards: BoardOutput[] }>(res, "Failed to fetch boards", (body) => ({
      boards: (body as { boards?: BoardOutput[] } | null)?.boards ?? [],
    }));
  },

  get: async (projectId: string, boardId: string) => {
    const res = await api.projects[":id"].boards[":boardId"].$get({ param: { id: projectId, boardId } });
    return readApiResult<BoardOutput>(res, "Failed to fetch board");
  },

  create: async (projectId: string, data: CreateBoardInput) => {
    const res = await api.projects[":id"].boards.$post({ param: { id: projectId }, json: data });
    return readApiResult<BoardOutput>(res, "Failed to create board");
  },

  update: async (projectId: string, boardId: string, data: UpdateBoardInput) => {
    const res = await api.projects[":id"].boards[":boardId"].$patch({
      param: { id: projectId, boardId },
      json: data,
    });
    return readApiResult<UpdateBoardOutput>(res, "Failed to update board");
  },

  delete: async (projectId: string, boardId: string) => {
    const res = await api.projects[":id"].boards[":boardId"].$delete({ param: { id: projectId, boardId } });
    return readApiResult<{ success: boolean }>(res, "Failed to delete board");
  },

  reorder: async (projectId: string, data: ReorderBoardsInput) => {
    const res = await api.projects[":id"].boards.reorder.$patch({ param: { id: projectId }, json: data });
    return readApiResult<{ success: boolean }>(res, "Failed to reorder boards");
  },
};
