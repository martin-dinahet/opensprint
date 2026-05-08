import { api } from "@/features/shared/api/client";
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
  list: async (boardId: string): Promise<{ tasks: TaskOutput[] }> => {
    const res = await api.boards[":boardId"].tasks.$get({ param: { boardId } });
    if (!res.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const body = await res.json();
    return { tasks: body.tasks ?? [] };
  },

  create: async (boardId: string, data: CreateTaskInput): Promise<TaskOutput> => {
    const res = await api.boards[":boardId"].tasks.$post({ param: { boardId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to create task");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to create task");
    }
    return body;
  },

  update: async (boardId: string, taskId: string, data: UpdateTaskInput): Promise<UpdateTaskOutput> => {
    const res = await api.boards[":boardId"].tasks[":taskId"].$patch({ param: { boardId, taskId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to update task");
    }
    const body = await res.json();
    if (!body) {
      throw new Error("Failed to update task");
    }
    return body;
  },

  delete: async (boardId: string, taskId: string): Promise<{ success: boolean }> => {
    const res = await api.boards[":boardId"].tasks[":taskId"].$delete({ param: { boardId, taskId } });
    if (!res.ok) {
      throw new Error("Failed to delete task");
    }
    return res.json() as Promise<{ success: boolean }>;
  },

  assign: async (taskId: string, data: AssignTaskInput): Promise<{ id: string; assigneeId: string | null }> => {
    const res = await api.tasks[":taskId"].assign.$patch({ param: { taskId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to assign task");
    }
    return res.json() as Promise<{ id: string; assigneeId: string | null }>;
  },

  move: async (taskId: string, data: MoveTaskInput): Promise<{ id: string; boardId: string; position: number }> => {
    const res = await api.tasks[":taskId"].move.$patch({ param: { taskId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to move task");
    }
    return res.json() as Promise<{ id: string; boardId: string; position: number }>;
  },

  reorder: async (taskId: string, data: ReorderTaskInput): Promise<{ id: string; position: number }> => {
    const res = await api.tasks[":taskId"].reorder.$patch({ param: { taskId }, json: data });
    if (!res.ok) {
      throw new Error("Failed to reorder task");
    }
    return res.json() as Promise<{ id: string; position: number }>;
  },
};
