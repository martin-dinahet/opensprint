import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateBoardInput, UpdateBoardInput } from "@/entities/board";
import { boardApi, boardKeys } from "@/entities/board";
import { unwrapClientResult } from "@/shared";

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: boardKeys.list(projectId),
    queryFn: async () => unwrapClientResult(await boardApi.list(projectId)).boards,
    enabled: !!projectId,
  });
}

export function useBoard(projectId: string, boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(projectId, boardId),
    queryFn: async () => unwrapClientResult(await boardApi.get(projectId, boardId)),
    enabled: !!projectId && !!boardId,
  });
}

export function useCreateBoard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoardInput) => unwrapClientResult(await boardApi.create(projectId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}

export function useUpdateBoard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, data }: { boardId: string; data: UpdateBoardInput }) =>
      unwrapClientResult(await boardApi.update(projectId, boardId, data)),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(projectId, boardId) });
    },
  });
}

export function useDeleteBoard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => unwrapClientResult(await boardApi.delete(projectId, boardId)),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(projectId, boardId) });
    },
  });
}
