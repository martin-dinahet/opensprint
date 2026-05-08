import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { memberApi, memberKeys } from "@/features/member/api";
import { makeProjectMember } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useProjectMembers } from ".";

vi.mock("@/features/member/api", () => ({
  memberKeys: {
    all: ["members"],
    lists: () => ["members", "list"],
    list: (projectId: string) => ["members", "list", projectId],
  },
  memberApi: {
    list: vi.fn(),
  },
}));

describe("member hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads project members with the project query key", async () => {
    const members = [makeProjectMember()];
    vi.mocked(memberApi.list).mockResolvedValue(ok({ members }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProjectMembers("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(members);
    expect(memberApi.list).toHaveBeenCalledWith("project-1");
    expect(queryClient.getQueryData(memberKeys.list("project-1"))).toEqual(members);
  });

  it("does not load members without a project id", () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProjectMembers(""), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(memberApi.list).not.toHaveBeenCalled();
  });
});
