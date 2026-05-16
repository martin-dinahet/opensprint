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
  list: (projectId: string) => [...columnKeys.lists(), projectId] as const,
} as const;

export const columnApi = {
  list: async (projectId: string) => {
    return requestApiResult<{ columns: ColumnOutput[] }>(
      () => api.projects[":projectId"].columns.$get({ param: { projectId } }),
      "Failed to fetch columns",
      (body) => ({
        columns: (body as { columns?: ColumnOutput[] } | null)?.columns ?? [],
      }),
    );
  },

  create: async (projectId: string, data: CreateColumnInput) => {
    return requestApiResult<ColumnOutput>(
      () => api.projects[":projectId"].columns.$post({ param: { projectId }, json: data }),
      "Failed to create column",
    );
  },

  update: async (projectId: string, columnId: string, data: UpdateColumnInput) => {
    return requestApiResult<UpdateColumnOutput>(
      () => api.projects[":projectId"].columns[":columnId"].$patch({ param: { projectId, columnId }, json: data }),
      "Failed to update column",
    );
  },

  delete: async (projectId: string, columnId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":projectId"].columns[":columnId"].$delete({ param: { projectId, columnId } }),
      "Failed to delete column",
    );
  },

  reorder: async (projectId: string, data: ReorderColumnsInput) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":projectId"].columns.reorder.$patch({ param: { projectId }, json: data }),
      "Failed to reorder columns",
    );
  },
};
