import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateColumnInput, UpdateColumnInput } from "@/entities/column";
import { columnApi, columnKeys } from "@/entities/column";
import { unwrapClientResult } from "@/shared";

export function useColumns(projectId: string, boardId: string) {
  return useQuery({
    queryKey: columnKeys.list(projectId, boardId),
    queryFn: async () => unwrapClientResult(await columnApi.list(projectId, boardId)).columns,
    enabled: !!projectId && !!boardId,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, projectId, data }: { boardId: string; projectId: string; data: CreateColumnInput }) =>
      unwrapClientResult(await columnApi.create(projectId, boardId, data)),
    onSuccess: (_, { boardId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId, boardId) });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      projectId,
      columnId,
      data,
    }: {
      boardId: string;
      projectId: string;
      columnId: string;
      data: UpdateColumnInput;
    }) => columnApi.update(projectId, boardId, columnId, data).then(unwrapClientResult),
    onSuccess: (_, { boardId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId, boardId) });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, projectId, columnId }: { boardId: string; projectId: string; columnId: string }) =>
      unwrapClientResult(await columnApi.delete(projectId, boardId, columnId)),
    onSuccess: (_, { boardId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId, boardId) });
    },
  });
}
