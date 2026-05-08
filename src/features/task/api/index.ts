import { api } from "@/features/shared/api/client";
import { readApiResult } from "@/features/shared/api/result";
import type {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  TaskOutput,
  UpdateTaskInput,
  UpdateTaskOutput,
} from "@/features/task/types";

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
    const res = await api.boards[":boardId"].tasks.$get({ param: { boardId } });
    return readApiResult<{ tasks: TaskOutput[] }>(res, "Failed to fetch tasks", (body) => ({
      tasks: (body as { tasks?: TaskOutput[] } | null)?.tasks ?? [],
    }));
  },

  create: async (boardId: string, data: CreateTaskInput) => {
    const res = await api.boards[":boardId"].tasks.$post({ param: { boardId }, json: data });
    return readApiResult<TaskOutput>(res, "Failed to create task");
  },

  update: async (boardId: string, taskId: string, data: UpdateTaskInput) => {
    const res = await api.boards[":boardId"].tasks[":taskId"].$patch({ param: { boardId, taskId }, json: data });
    return readApiResult<UpdateTaskOutput>(res, "Failed to update task");
  },

  delete: async (boardId: string, taskId: string) => {
    const res = await api.boards[":boardId"].tasks[":taskId"].$delete({ param: { boardId, taskId } });
    return readApiResult<{ success: boolean }>(res, "Failed to delete task");
  },

  assign: async (taskId: string, data: AssignTaskInput) => {
    const res = await api.tasks[":taskId"].assign.$patch({ param: { taskId }, json: data });
    return readApiResult<{ id: string; assigneeId: string | null }>(res, "Failed to assign task");
  },

  move: async (taskId: string, data: MoveTaskInput) => {
    const res = await api.tasks[":taskId"].move.$patch({ param: { taskId }, json: data });
    return readApiResult<{ id: string; boardId: string; position: number }>(res, "Failed to move task");
  },

  reorder: async (taskId: string, data: ReorderTaskInput) => {
    const res = await api.tasks[":taskId"].reorder.$patch({ param: { taskId }, json: data });
    return readApiResult<{ id: string; position: number }>(res, "Failed to reorder task");
  },
};
