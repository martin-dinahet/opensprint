import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateInvitationInput } from "@/entities/invitation";
import { invitationApi, invitationKeys } from "@/entities/invitation";
import { memberKeys } from "@/entities/member";
import { projectKeys } from "@/entities/project";
import { unwrapClientResult } from "@/shared";

export function useUserInvitations() {
  return useQuery({
    queryKey: invitationKeys.user(),
    queryFn: async () => unwrapClientResult(await invitationApi.listUser()).invitations,
  });
}

export function useProjectInvitations(projectId: string, enabled = true) {
  return useQuery({
    queryKey: invitationKeys.project(projectId),
    queryFn: async () => unwrapClientResult(await invitationApi.listProject(projectId)).invitations,
    enabled: !!projectId && enabled,
  });
}

export function useCreateInvitation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvitationInput) => unwrapClientResult(await invitationApi.create(projectId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.project(projectId) });
    },
  });
}

export function useCancelInvitation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => unwrapClientResult(await invitationApi.cancel(projectId, invitationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: invitationKeys.user() });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => unwrapClientResult(await invitationApi.accept(invitationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => unwrapClientResult(await invitationApi.decline(invitationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
    },
  });
}
