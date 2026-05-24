import type {
  AssignTaskInput,
  AttachTaskTagInput,
  CreateProjectTaskTagInput,
  CreateTaskInput,
  CreateTaskItemInput,
  MoveTaskInput,
  ProjectTaskTagOutput,
  ReorderTaskInput,
  ReorderTaskItemsInput,
  TaskItemOutput,
  TaskOutput,
  TransferTaskInput,
  UpdateProjectTaskTagInput,
  UpdateTaskInput,
  UpdateTaskItemInput,
  UpdateTaskOutput,
} from "@/entities/task";
import { api, requestApiResult } from "@/shared";

const BASE_KEY = "tasks";

export const taskKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (columnId: string) => [...taskKeys.lists(), columnId] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  projectTags: (projectId: string) => [...taskKeys.all, "project-tags", projectId] as const,
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

  transfer: async (taskId: string, data: TransferTaskInput) => {
    return requestApiResult<{ id: string; columnId: string; position: number }>(
      () => api.tasks[":taskId"].transfer.$patch({ param: { taskId }, json: data }),
      "Failed to transfer task",
    );
  },

  reorder: async (taskId: string, data: ReorderTaskInput) => {
    return requestApiResult<{ id: string; position: number }>(
      () => api.tasks[":taskId"].reorder.$patch({ param: { taskId }, json: data }),
      "Failed to reorder task",
    );
  },

  createItem: async (taskId: string, data: CreateTaskItemInput) => {
    return requestApiResult<TaskItemOutput>(
      () => api.tasks[":taskId"].items.$post({ param: { taskId }, json: data }),
      "Failed to create task item",
    );
  },

  updateItem: async (taskId: string, itemId: string, data: UpdateTaskItemInput) => {
    return requestApiResult<TaskItemOutput>(
      () => api.tasks[":taskId"].items[":itemId"].$patch({ param: { taskId, itemId }, json: data }),
      "Failed to update task item",
    );
  },

  deleteItem: async (taskId: string, itemId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.tasks[":taskId"].items[":itemId"].$delete({ param: { taskId, itemId } }),
      "Failed to delete task item",
    );
  },

  reorderItems: async (taskId: string, data: ReorderTaskItemsInput) => {
    return requestApiResult<{ items: TaskItemOutput[] }>(
      () => api.tasks[":taskId"].items.reorder.$patch({ param: { taskId }, json: data }),
      "Failed to reorder task items",
    );
  },

  listProjectTags: async (projectId: string) => {
    return requestApiResult<{ tags: ProjectTaskTagOutput[] }>(
      () => api.projects[":id"]["task-tags"].$get({ param: { id: projectId } }),
      "Failed to fetch task tags",
      (body) => ({
        tags: (body as { tags?: ProjectTaskTagOutput[] } | null)?.tags ?? [],
      }),
    );
  },

  createProjectTag: async (projectId: string, data: CreateProjectTaskTagInput) => {
    return requestApiResult<ProjectTaskTagOutput>(
      () => api.projects[":id"]["task-tags"].$post({ param: { id: projectId }, json: data }),
      "Failed to create task tag",
    );
  },

  updateProjectTag: async (projectId: string, tagId: string, data: UpdateProjectTaskTagInput) => {
    return requestApiResult<ProjectTaskTagOutput>(
      () => api.projects[":id"]["task-tags"][":tagId"].$patch({ param: { id: projectId, tagId }, json: data }),
      "Failed to update task tag",
    );
  },

  deleteProjectTag: async (projectId: string, tagId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"]["task-tags"][":tagId"].$delete({ param: { id: projectId, tagId } }),
      "Failed to delete task tag",
    );
  },

  attachTag: async (taskId: string, data: AttachTaskTagInput) => {
    return requestApiResult<ProjectTaskTagOutput>(
      () => api.tasks[":taskId"].tags.$post({ param: { taskId }, json: data }),
      "Failed to attach task tag",
    );
  },

  detachTag: async (taskId: string, tagId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.tasks[":taskId"].tags[":tagId"].$delete({ param: { taskId, tagId } }),
      "Failed to detach task tag",
    );
  },
};
