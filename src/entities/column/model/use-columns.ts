import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateColumnInput, UpdateColumnInput } from "@/entities/column";
import { columnApi, columnKeys } from "@/entities/column/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useColumns(projectId: string) {
  return useQuery({
    queryKey: columnKeys.list(projectId),
    queryFn: async () => unwrapClientResult(await columnApi.list(projectId)).columns,
    enabled: !!projectId,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: CreateColumnInput }) =>
      unwrapClientResult(await columnApi.create(projectId, data)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, columnId, data }: { projectId: string; columnId: string; data: UpdateColumnInput }) =>
      columnApi.update(projectId, columnId, data).then(unwrapClientResult),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, columnId }: { projectId: string; columnId: string }) =>
      unwrapClientResult(await columnApi.delete(projectId, columnId)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) });
    },
  });
}
