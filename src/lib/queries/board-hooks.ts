import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi, boardKeys } from "./boards";

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: boardKeys.list(projectId),
    queryFn: () => boardApi.list(projectId).then((res) => res.boards),
    enabled: !!projectId,
  });
}

export function useBoard(projectId: string, boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => boardApi.get(projectId, boardId),
    enabled: !!projectId && !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { name: string } }) =>
      boardApi.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      boardId,
      data,
    }: {
      projectId: string;
      boardId: string;
      data: { name?: string; position?: number };
    }) => boardApi.update(projectId, boardId, data),
    onSuccess: (_, { projectId, boardId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, boardId }: { projectId: string; boardId: string }) => boardApi.delete(projectId, boardId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}

export function useReorderBoards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, boardIds }: { projectId: string; boardIds: string[] }) =>
      boardApi.reorder(projectId, { boardIds }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.list(projectId) });
    },
  });
}
