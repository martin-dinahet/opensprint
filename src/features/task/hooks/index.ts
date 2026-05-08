import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrapClientResult } from "@/features/shared/api/result";
import { taskApi, taskKeys } from "@/features/task/api";
import type { CreateTaskInput, MoveTaskInput, TaskOutput, UpdateTaskInput } from "@/features/task/types";

export function useTasks(boardId: string) {
  return useQuery({
    queryKey: taskKeys.list(boardId),
    queryFn: async () => unwrapClientResult(await taskApi.list(boardId)).tasks,
    enabled: !!boardId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: CreateTaskInput }) =>
      unwrapClientResult(await taskApi.create(boardId, data)),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, taskId, data }: { boardId: string; taskId: string; data: UpdateTaskInput }) =>
      taskApi.update(boardId, taskId, data).then(unwrapClientResult),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, taskId }: { boardId: string; taskId: string }) =>
      unwrapClientResult(await taskApi.delete(boardId, taskId)),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
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

      queryClient.setQueryData<TaskOutput[]>(taskKeys.list(data.boardId), (tasks = []) => {
        const nextTasks = tasks.filter((candidate) => candidate.id !== taskId);
        const nextTask = {
          ...movedTask,
          boardId: data.boardId,
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
