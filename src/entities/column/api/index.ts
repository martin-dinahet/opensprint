import type {
  ColumnOutput,
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
  UpdateColumnOutput,
} from "@/entities/column";
import { api } from "@/shared/api/client";
import { requestApiResult } from "@/shared/api/result";

const BASE_KEY = "columns";

export const columnKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...columnKeys.all, "list"] as const,
  list: (boardId: string) => [...columnKeys.lists(), boardId] as const,
  details: () => [...columnKeys.all, "detail"] as const,
  detail: (id: string) => [...columnKeys.details(), id] as const,
} as const;

export const columnApi = {
  list: async (boardId: string) => {
    return requestApiResult<{ columns: ColumnOutput[] }>(
      () => api.boards[":boardId"].columns.$get({ param: { boardId } }),
      "Failed to fetch columns",
      (body) => ({
        columns: (body as { columns?: ColumnOutput[] } | null)?.columns ?? [],
      }),
    );
  },

  get: async (boardId: string, columnId: string) => {
    return requestApiResult<ColumnOutput>(
      () => api.boards[":boardId"].columns[":columnId"].$get({ param: { boardId, columnId } }),
      "Failed to fetch column",
    );
  },

  create: async (boardId: string, data: CreateColumnInput) => {
    return requestApiResult<ColumnOutput>(
      () => api.boards[":boardId"].columns.$post({ param: { boardId }, json: data }),
      "Failed to create column",
    );
  },

  update: async (boardId: string, columnId: string, data: UpdateColumnInput) => {
    return requestApiResult<UpdateColumnOutput>(
      () =>
        api.boards[":boardId"].columns[":columnId"].$patch({
          param: { boardId, columnId },
          json: data,
        }),
      "Failed to update column",
    );
  },

  delete: async (boardId: string, columnId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.boards[":boardId"].columns[":columnId"].$delete({ param: { boardId, columnId } }),
      "Failed to delete column",
    );
  },

  reorder: async (boardId: string, data: ReorderColumnsInput) => {
    return requestApiResult<{ success: boolean }>(
      () => api.boards[":boardId"].columns.reorder.$patch({ param: { boardId }, json: data }),
      "Failed to reorder columns",
    );
  },
};
