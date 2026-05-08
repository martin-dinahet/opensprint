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
  list: (boardId: string) => [...taskKeys.lists(), boardId] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
} as const;

export const taskApi = {
  list: async (boardId: string) => {
    return requestApiResult<{ tasks: TaskOutput[] }>(
      () => api.boards[":boardId"].tasks.$get({ param: { boardId } }),
      "Failed to fetch tasks",
      (body) => ({
        tasks: (body as { tasks?: TaskOutput[] } | null)?.tasks ?? [],
      }),
    );
  },

  create: async (boardId: string, data: CreateTaskInput) => {
    return requestApiResult<TaskOutput>(
      () => api.boards[":boardId"].tasks.$post({ param: { boardId }, json: data }),
      "Failed to create task",
    );
  },

  update: async (boardId: string, taskId: string, data: UpdateTaskInput) => {
    return requestApiResult<UpdateTaskOutput>(
      () => api.boards[":boardId"].tasks[":taskId"].$patch({ param: { boardId, taskId }, json: data }),
      "Failed to update task",
    );
  },

  delete: async (boardId: string, taskId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.boards[":boardId"].tasks[":taskId"].$delete({ param: { boardId, taskId } }),
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
    return requestApiResult<{ id: string; boardId: string; position: number }>(
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
