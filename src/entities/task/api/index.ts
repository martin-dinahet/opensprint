import type {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  TaskOutput,
  UpdateTaskInput,
  UpdateTaskOutput,
} from "@/entities/task";
import { api } from "@/shared/api/client";
import { requestApiResult } from "@/shared/api/result";

const BASE_KEY = "tasks";

export const taskKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (columnId: string) => [...taskKeys.lists(), columnId] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
} as const;

export const taskApi = {
  list: async (columnId: string) => {
    return requestApiResult<{ tasks: TaskOutput[] }>(
      () => api.columns[":columnId"].tasks.$get({ param: { columnId } }),
      "Failed to fetch tasks",
      (body) => ({
        tasks: (body as { tasks?: TaskOutput[] } | null)?.tasks ?? [],
      }),
    );
  },

  create: async (columnId: string, data: CreateTaskInput) => {
    return requestApiResult<TaskOutput>(
      () => api.columns[":columnId"].tasks.$post({ param: { columnId }, json: data }),
      "Failed to create task",
    );
  },

  update: async (columnId: string, taskId: string, data: UpdateTaskInput) => {
    return requestApiResult<UpdateTaskOutput>(
      () => api.columns[":columnId"].tasks[":taskId"].$patch({ param: { columnId, taskId }, json: data }),
      "Failed to update task",
    );
  },

  delete: async (columnId: string, taskId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.columns[":columnId"].tasks[":taskId"].$delete({ param: { columnId, taskId } }),
      "Failed to delete task",
    );
  },

  assign: async (taskId: string, data: AssignTaskInput) => {
    return requestApiResult<{ id: string; assigneeId: string | null }>(
      () => api.tasks[":taskId"].assign.$patch({ param: { taskId }, json: data }),
      "Failed to assign task",
    );
  },

  move: async (taskId: string, data: MoveTaskInput) => {
    return requestApiResult<{ id: string; columnId: string; position: number }>(
      () => api.tasks[":taskId"].move.$patch({ param: { taskId }, json: data }),
      "Failed to move task",
    );
  },

  reorder: async (taskId: string, data: ReorderTaskInput) => {
    return requestApiResult<{ id: string; position: number }>(
      () => api.tasks[":taskId"].reorder.$patch({ param: { taskId }, json: data }),
      "Failed to reorder task",
    );
  },
};
