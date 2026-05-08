import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrapClientResult } from "@/features/shared/api/result";
import { taskApi, taskKeys } from "@/features/task/api";
import type { CreateTaskInput, MoveTaskInput, UpdateTaskInput } from "@/features/task/types";

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
    mutationFn: async ({ taskId, data }: { taskId: string; data: MoveTaskInput }) =>
      unwrapClientResult(await taskApi.move(taskId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
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
