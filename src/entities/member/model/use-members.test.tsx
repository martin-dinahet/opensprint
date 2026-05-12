import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { memberApi, memberKeys } from "@/entities/member/api";
import { makeProjectMember } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useAddProjectMember, useProjectMembers, useRemoveProjectMember, useUpdateProjectMember } from ".";

vi.mock("@/entities/member/api", () => ({
  memberKeys: {
    all: ["members"],
    lists: () => ["members", "list"],
    list: (projectId: string) => ["members", "list", projectId],
  },
  memberApi: {
    add: vi.fn(),
    remove: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
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

  it("adds members and invalidates the project member list", async () => {
    const member = makeProjectMember();
    vi.mocked(memberApi.add).mockResolvedValue(ok(member));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(memberKeys.list("project-1"), []);

    const { result } = renderHook(() => useAddProjectMember("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await result.current.mutateAsync({ email: "teammate@example.com", role: "member" });

    expect(memberApi.add).toHaveBeenCalledWith("project-1", { email: "teammate@example.com", role: "member" });
    expect(queryClient.getQueryState(memberKeys.list("project-1"))?.isInvalidated).toBe(true);
  });

  it("updates members and invalidates the project member list", async () => {
    const member = makeProjectMember({ role: "admin" });
    vi.mocked(memberApi.update).mockResolvedValue(ok(member));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(memberKeys.list("project-1"), [makeProjectMember()]);

    const { result } = renderHook(() => useUpdateProjectMember("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await result.current.mutateAsync({ memberId: "member-1", data: { role: "admin" } });

    expect(memberApi.update).toHaveBeenCalledWith("project-1", "member-1", { role: "admin" });
    expect(queryClient.getQueryState(memberKeys.list("project-1"))?.isInvalidated).toBe(true);
  });

  it("removes members and invalidates the project member list", async () => {
    vi.mocked(memberApi.remove).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(memberKeys.list("project-1"), [makeProjectMember()]);

    const { result } = renderHook(() => useRemoveProjectMember("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await result.current.mutateAsync("member-1");

    expect(memberApi.remove).toHaveBeenCalledWith("project-1", "member-1");
    expect(queryClient.getQueryState(memberKeys.list("project-1"))?.isInvalidated).toBe(true);
  });
});
