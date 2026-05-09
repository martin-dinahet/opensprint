import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateBoardInput, UpdateBoardInput } from "@/entities/board";
import { boardApi, boardKeys } from "@/entities/board/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: boardKeys.list(projectId),
    queryFn: async () => unwrapClientResult(await boardApi.list(projectId)).boards,
    enabled: !!projectId,
  });
}

export function useBoard(projectId: string, boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async () => unwrapClientResult(await boardApi.get(projectId, boardId)),
    enabled: !!projectId && !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { data: CreateBoardInput; projectId: string }) =>
      unwrapClientResult(await boardApi.create(projectId, data)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, boardId, data }: { boardId: string; data: UpdateBoardInput; projectId: string }) =>
      boardApi.update(projectId, boardId, data).then(unwrapClientResult),
    onSuccess: (_, { projectId, boardId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId }: { boardId: string; projectId: string }) =>
      unwrapClientResult(await boardApi.delete(projectId, boardId)),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}

export function useReorderBoards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, boardIds }: { boardIds: string[]; projectId: string }) =>
      boardApi.reorder(projectId, { boardIds }).then(unwrapClientResult),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}
