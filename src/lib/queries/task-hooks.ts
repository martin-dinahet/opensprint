import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskApi, taskKeys } from "./tasks";

export function useTasks(boardId: string) {
  return useQuery({
    queryKey: taskKeys.list(boardId),
    queryFn: () => taskApi.list(boardId).then((res) => res.tasks),
    enabled: !!boardId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: {
        title: string;
        description?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        assigneeId?: string;
        dueDate?: string;
      };
    }) => taskApi.create(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      taskId,
      data,
    }: {
      boardId: string;
      taskId: string;
      data: {
        title?: string;
        description?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        dueDate?: string | null;
      };
    }) => taskApi.update(boardId, taskId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, taskId }: { boardId: string; taskId: string }) => taskApi.delete(boardId, taskId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(boardId) });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) =>
      taskApi.assign(taskId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: { boardId: string; position?: number } }) =>
      taskApi.move(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, position }: { taskId: string; position: number }) => taskApi.reorder(taskId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
