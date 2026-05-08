import type { MemberWithUserOutput } from "@/entities/member";
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
      "Failed to fetch project members",
      (body) => ({
        members: (body as { members?: MemberWithUserOutput[] } | null)?.members ?? [],
      }),
    );
  },
};
