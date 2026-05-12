import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskInput, MoveTaskInput, TaskOutput, UpdateTaskInput } from "@/entities/task";
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
