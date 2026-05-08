import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectInput, UpdateProjectInput } from "@/entities/project";
import { projectApi, projectKeys } from "@/entities/project/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const res = await projectApi.list();
      return unwrapClientResult(res).projects;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => unwrapClientResult(await projectApi.get(id)),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => unwrapClientResult(await projectApi.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      unwrapClientResult(await projectApi.update(id, data)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrapClientResult(await projectApi.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
