import type {
  ColumnOutput,
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
  UpdateColumnOutput,
} from "@/entities/column";
import { api, requestApiResult } from "@/shared";

const BASE_KEY = "columns";

export const columnKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...columnKeys.all, "list"] as const,
  list: (projectId: string, boardId: string) => [...columnKeys.lists(), projectId, boardId] as const,
} as const;

export const columnApi = {
  list: async (projectId: string, boardId: string) => {
    return requestApiResult<{ columns: ColumnOutput[] }>(
      () => api.projects[":id"].boards[":boardId"].columns.$get({ param: { id: projectId, boardId } }),
      "Failed to fetch columns",
      (body) => ({
        columns: (body as { columns?: ColumnOutput[] } | null)?.columns ?? [],
      }),
    );
  },

  create: async (projectId: string, boardId: string, data: CreateColumnInput) => {
    return requestApiResult<ColumnOutput>(
      () => api.projects[":id"].boards[":boardId"].columns.$post({ param: { id: projectId, boardId }, json: data }),
      "Failed to create column",
    );
  },

  update: async (projectId: string, boardId: string, columnId: string, data: UpdateColumnInput) => {
    return requestApiResult<UpdateColumnOutput>(
      () =>
        api.projects[":id"].boards[":boardId"].columns[":columnId"].$patch({
          param: { id: projectId, boardId, columnId },
          json: data,
        }),
      "Failed to update column",
    );
  },

  delete: async (projectId: string, boardId: string, columnId: string) => {
    return requestApiResult<{ success: boolean }>(
      () =>
        api.projects[":id"].boards[":boardId"].columns[":columnId"].$delete({
          param: { id: projectId, boardId, columnId },
        }),
      "Failed to delete column",
    );
  },

  reorder: async (projectId: string, boardId: string, data: ReorderColumnsInput) => {
    return requestApiResult<{ success: boolean }>(
      () =>
        api.projects[":id"].boards[":boardId"].columns.reorder.$patch({
          param: { id: projectId, boardId },
          json: data,
        }),
      "Failed to reorder columns",
    );
  },
};
