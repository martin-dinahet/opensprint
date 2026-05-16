import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProjectTaskTagInput,
  CreateTaskInput,
  MoveTaskInput,
  TaskOutput,
  UpdateProjectTaskTagInput,
  UpdateTaskInput,
} from "@/entities/task";
import { taskApi, taskKeys } from "@/entities/task/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useTasks(columnId: string) {
  return useQuery({
    queryKey: taskKeys.list(columnId),
    queryFn: async () => unwrapClientResult(await taskApi.list(columnId)).tasks,
    enabled: !!columnId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, data }: { columnId: string; data: CreateTaskInput }) =>
      unwrapClientResult(await taskApi.create(columnId, data)),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ columnId, taskId, data }: { columnId: string; taskId: string; data: UpdateTaskInput }) =>
      taskApi.update(columnId, taskId, data).then(unwrapClientResult),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, taskId }: { columnId: string; taskId: string }) =>
      unwrapClientResult(await taskApi.delete(columnId, taskId)),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) =>
      taskApi.assign(taskId, { assigneeId }).then(unwrapClientResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { data: MoveTaskInput; task?: TaskOutput; taskId: string }) =>
      unwrapClientResult(await taskApi.move(taskId, data)),
    onMutate: async ({ data, task, taskId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousTaskLists = queryClient.getQueriesData<TaskOutput[]>({ queryKey: taskKeys.lists() });
      const movedTask =
        task ??
        previousTaskLists.flatMap(([, tasks]) => tasks ?? []).find((candidate) => candidate.id === taskId) ??
        null;

      if (!movedTask) {
        return { previousTaskLists };
      }

      for (const [queryKey, tasks] of previousTaskLists) {
        queryClient.setQueryData<TaskOutput[]>(
          queryKey,
          (tasks ?? []).filter((candidate) => candidate.id !== taskId),
        );
      }

      queryClient.setQueryData<TaskOutput[]>(taskKeys.list(data.columnId), (tasks = []) => {
        const nextTasks = tasks.filter((candidate) => candidate.id !== taskId);
        const nextTask = {
          ...movedTask,
          columnId: data.columnId,
          position: data.position ?? movedTask.position,
        };
        const insertAt = data.position ?? nextTasks.length;

        nextTasks.splice(Math.max(0, Math.min(insertAt, nextTasks.length)), 0, nextTask);

        return nextTasks;
      });

      return { previousTaskLists };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, tasks] of context?.previousTaskLists ?? []) {
        queryClient.setQueryData(queryKey, tasks);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, position }: { taskId: string; position: number }) =>
      unwrapClientResult(await taskApi.reorder(taskId, { position })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useProjectTaskTags(projectId: string) {
  return useQuery({
    queryKey: taskKeys.projectTags(projectId),
    queryFn: async () => unwrapClientResult(await taskApi.listProjectTags(projectId)).tags,
    enabled: !!projectId,
  });
}

export function useCreateTaskItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title }: { columnId: string; taskId: string; title: string }) =>
      unwrapClientResult(await taskApi.createItem(taskId, { title })),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useUpdateTaskItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      done,
      itemId,
      taskId,
      title,
    }: {
      columnId: string;
      done?: boolean;
      itemId: string;
      taskId: string;
      title?: string;
    }) => unwrapClientResult(await taskApi.updateItem(taskId, itemId, { done, title })),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useDeleteTaskItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, taskId }: { columnId: string; itemId: string; taskId: string }) =>
      unwrapClientResult(await taskApi.deleteItem(taskId, itemId)),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useReorderTaskItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemIds, taskId }: { columnId: string; itemIds: string[]; taskId: string }) =>
      unwrapClientResult(await taskApi.reorderItems(taskId, { itemIds })),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useCreateProjectTaskTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, projectId }: { data: CreateProjectTaskTagInput; projectId: string }) =>
      unwrapClientResult(await taskApi.createProjectTag(projectId, data)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.projectTags(projectId) });
    },
  });
}

export function useUpdateProjectTaskTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      projectId,
      tagId,
    }: {
      data: UpdateProjectTaskTagInput;
      projectId: string;
      tagId: string;
    }) => unwrapClientResult(await taskApi.updateProjectTag(projectId, tagId, data)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.projectTags(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteProjectTaskTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, tagId }: { projectId: string; tagId: string }) =>
      unwrapClientResult(await taskApi.deleteProjectTag(projectId, tagId)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.projectTags(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useAttachTaskTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, taskId }: { columnId: string; tagId: string; taskId: string }) =>
      unwrapClientResult(await taskApi.attachTag(taskId, { tagId })),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}

export function useDetachTaskTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, taskId }: { columnId: string; tagId: string; taskId: string }) =>
      unwrapClientResult(await taskApi.detachTag(taskId, tagId)),
    onSuccess: (_, { columnId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(columnId) });
    },
  });
}
