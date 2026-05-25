import type { CreateInvitationInput, InvitationOutput } from "@/entities/invitation";
import { api, requestApiResult } from "@/shared";

const BASE_KEY = "invitations";

export const invitationKeys = {
  all: [BASE_KEY] as const,
  user: () => [...invitationKeys.all, "user"] as const,
  projects: () => [...invitationKeys.all, "project"] as const,
  project: (projectId: string) => [...invitationKeys.projects(), projectId] as const,
} as const;

export const invitationApi = {
  listUser: async () => {
    return requestApiResult<{ invitations: InvitationOutput[] }>(
      () => api.invitations.$get(),
      "Failed to fetch invitations",
      (body) => ({
        invitations: (body as { invitations?: InvitationOutput[] } | null)?.invitations ?? [],
      }),
    );
  },

  listProject: async (projectId: string) => {
    return requestApiResult<{ invitations: InvitationOutput[] }>(
      () => api.projects[":id"].invitations.$get({ param: { id: projectId } }),
      "Failed to fetch project invitations",
      (body) => ({
        invitations: (body as { invitations?: InvitationOutput[] } | null)?.invitations ?? [],
      }),
    );
  },

  create: async (projectId: string, data: CreateInvitationInput) => {
    return requestApiResult<InvitationOutput>(
      () => api.projects[":id"].invitations.$post({ param: { id: projectId }, json: data }),
      "Failed to send invitation",
    );
  },

  cancel: async (projectId: string, invitationId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"].invitations[":invitationId"].$delete({ param: { id: projectId, invitationId } }),
      "Failed to cancel invitation",
    );
  },

  accept: async (invitationId: string) => {
    return requestApiResult(
      () => api.invitations[":invitationId"].accept.$post({ param: { invitationId } }),
      "Failed to accept invitation",
    );
  },

  decline: async (invitationId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.invitations[":invitationId"].decline.$post({ param: { invitationId } }),
      "Failed to decline invitation",
    );
  },
};
