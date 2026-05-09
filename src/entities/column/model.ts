import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateColumnInput, UpdateColumnInput } from "@/entities/column";
import { columnApi, columnKeys } from "@/entities/column/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useColumns(boardId: string) {
  return useQuery({
    queryKey: columnKeys.list(boardId),
    queryFn: async () => unwrapClientResult(await columnApi.list(boardId)).columns,
    enabled: !!boardId,
  });
}

export function useColumn(boardId: string, columnId: string) {
  return useQuery({
    queryKey: columnKeys.detail(columnId),
    queryFn: async () => unwrapClientResult(await columnApi.get(boardId, columnId)),
    enabled: !!boardId && !!columnId,
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: CreateColumnInput }) =>
      unwrapClientResult(await columnApi.create(boardId, data)),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(boardId) });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, data }: { boardId: string; columnId: string; data: UpdateColumnInput }) =>
      columnApi.update(boardId, columnId, data).then(unwrapClientResult),
    onSuccess: (_, { boardId, columnId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(boardId) });
      queryClient.invalidateQueries({ queryKey: columnKeys.detail(columnId) });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, columnId }: { boardId: string; columnId: string }) =>
      unwrapClientResult(await columnApi.delete(boardId, columnId)),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(boardId) });
    },
  });
}

export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnIds }: { boardId: string; columnIds: string[] }) =>
      columnApi.reorder(boardId, { columnIds }).then(unwrapClientResult),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(boardId) });
    },
  });
}
