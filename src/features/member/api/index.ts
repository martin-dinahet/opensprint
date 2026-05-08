import { api } from "@/features/shared/api/client";
import { readApiResult } from "@/features/shared/api/result";
import type { MemberWithUserOutput } from "@/features/member/types";

const BASE_KEY = "members";

export const memberKeys = {
  all: [BASE_KEY] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (projectId: string) => [...memberKeys.lists(), projectId] as const,
} as const;

export const memberApi = {
  list: async (projectId: string) => {
    const res = await api.projects[":id"].members.$get({ param: { id: projectId } });
    return readApiResult<{ members: MemberWithUserOutput[] }>(res, "Failed to fetch project members", (body) => ({
      members: (body as { members?: MemberWithUserOutput[] } | null)?.members ?? [],
    }));
  },
};
