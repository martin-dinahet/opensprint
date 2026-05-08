import type {
  BoardOutput,
  CreateBoardInput,
  ReorderBoardsInput,
  UpdateBoardInput,
  UpdateBoardOutput,
} from "@/entities/board";
import { api } from "@/shared/api/client";
import { requestApiResult } from "@/shared/api/result";

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
    return requestApiResult<{ boards: BoardOutput[] }>(
      () => api.projects[":id"].boards.$get({ param: { id: projectId } }),
      "Failed to fetch boards",
      (body) => ({
        boards: (body as { boards?: BoardOutput[] } | null)?.boards ?? [],
      }),
    );
  },

  get: async (projectId: string, boardId: string) => {
    return requestApiResult<BoardOutput>(
      () => api.projects[":id"].boards[":boardId"].$get({ param: { id: projectId, boardId } }),
      "Failed to fetch board",
    );
  },

  create: async (projectId: string, data: CreateBoardInput) => {
    return requestApiResult<BoardOutput>(
      () => api.projects[":id"].boards.$post({ param: { id: projectId }, json: data }),
      "Failed to create board",
    );
  },

  update: async (projectId: string, boardId: string, data: UpdateBoardInput) => {
    return requestApiResult<UpdateBoardOutput>(
      () =>
        api.projects[":id"].boards[":boardId"].$patch({
          param: { id: projectId, boardId },
          json: data,
        }),
      "Failed to update board",
    );
  },

  delete: async (projectId: string, boardId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"].boards[":boardId"].$delete({ param: { id: projectId, boardId } }),
      "Failed to delete board",
    );
  },

  reorder: async (projectId: string, data: ReorderBoardsInput) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"].boards.reorder.$patch({ param: { id: projectId }, json: data }),
      "Failed to reorder boards",
    );
  },
};
