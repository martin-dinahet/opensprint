import type { AddMemberInput, MemberWithUserOutput, UpdateMemberInput } from "@/entities/member";
import { api } from "@/shared/api/client";
import { requestApiResult } from "@/shared/api/result";

const BASE_KEY = "members";

export const memberKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (projectId: string) => [...memberKeys.lists(), projectId] as const,
} as const;

export const memberApi = {
  list: async (projectId: string) => {
    return requestApiResult<{ members: MemberWithUserOutput[] }>(
      () => api.projects[":id"].members.$get({ param: { id: projectId } }),
      "Failed to fetch members",
      (body) => ({
        members: (body as { members?: MemberWithUserOutput[] } | null)?.members ?? [],
      }),
    );
  },

  add: async (projectId: string, data: AddMemberInput) => {
    return requestApiResult<MemberWithUserOutput>(
      () => api.projects[":id"].members.$post({ param: { id: projectId }, json: data }),
      "Failed to add member",
    );
  },

  update: async (projectId: string, memberId: string, data: UpdateMemberInput) => {
    return requestApiResult<MemberWithUserOutput>(
      () => api.projects[":id"].members[":memberId"].$patch({ param: { id: projectId, memberId }, json: data }),
      "Failed to update member",
    );
  },

  remove: async (projectId: string, memberId: string) => {
    return requestApiResult<{ success: boolean }>(
      () => api.projects[":id"].members[":memberId"].$delete({ param: { id: projectId, memberId } }),
      "Failed to remove member",
    );
  },
};
