import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddMemberInput, UpdateMemberInput } from "@/entities/member";
import { memberApi, memberKeys } from "@/entities/member/api";
import { unwrapClientResult } from "@/shared/api/result";

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: memberKeys.list(projectId),
    queryFn: async () => unwrapClientResult(await memberApi.list(projectId)).members,
    enabled: !!projectId,
  });
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddMemberInput) => unwrapClientResult(await memberApi.add(projectId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) });
    },
  });
}

export function useUpdateMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateMemberInput }) =>
      unwrapClientResult(await memberApi.update(projectId, memberId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => unwrapClientResult(await memberApi.remove(projectId, memberId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) });
    },
  });
}
