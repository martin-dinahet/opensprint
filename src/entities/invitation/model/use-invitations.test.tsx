import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invitationApi, invitationKeys } from "@/entities/invitation";
import { memberKeys } from "@/entities/member";
import { projectKeys } from "@/entities/project";
import { createTestQueryClient } from "@/test/render";
import {
  useAcceptInvitation,
  useCancelInvitation,
  useCreateInvitation,
  useDeclineInvitation,
  useProjectInvitations,
  useUserInvitations,
} from ".";

vi.mock("@/entities/invitation", () => ({
  invitationKeys: {
    all: ["invitations"],
    user: () => ["invitations", "user"],
    projects: () => ["invitations", "project"],
    project: (projectId: string) => ["invitations", "project", projectId],
  },
  invitationApi: {
    accept: vi.fn(),
    cancel: vi.fn(),
    create: vi.fn(),
    decline: vi.fn(),
    listProject: vi.fn(),
    listUser: vi.fn(),
  },
}));

vi.mock("@/entities/member", () => ({
  memberKeys: {
    all: ["members"],
  },
}));

vi.mock("@/entities/project", () => ({
  projectKeys: {
    all: ["projects"],
  },
}));

const invitation = {
  id: "invitation-1",
  projectId: "project-1",
  email: "invitee@example.com",
  role: "member" as const,
  status: "pending" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-01-08T00:00:00.000Z",
  inviter: { id: "user-1", name: "Owner", email: "owner@example.com", image: null },
  project: { id: "project-1", name: "Launch" },
};

function wrapper(queryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("invitation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads current user invitations", async () => {
    vi.mocked(invitationApi.listUser).mockResolvedValue(ok({ invitations: [invitation] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUserInvitations(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([invitation]);
    expect(queryClient.getQueryData(invitationKeys.user())).toEqual([invitation]);
  });

  it("loads project invitations only when enabled", async () => {
    vi.mocked(invitationApi.listProject).mockResolvedValue(ok({ invitations: [invitation] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProjectInvitations("project-1", true), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invitationApi.listProject).toHaveBeenCalledWith("project-1");
    expect(queryClient.getQueryData(invitationKeys.project("project-1"))).toEqual([invitation]);
  });

  it("creates and cancels project invitations with invalidation", async () => {
    vi.mocked(invitationApi.create).mockResolvedValue(ok(invitation));
    vi.mocked(invitationApi.cancel).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(invitationKeys.project("project-1"), []);
    queryClient.setQueryData(invitationKeys.user(), []);

    const createHook = renderHook(() => useCreateInvitation("project-1"), { wrapper: wrapper(queryClient) });
    const cancelHook = renderHook(() => useCancelInvitation("project-1"), { wrapper: wrapper(queryClient) });

    await createHook.result.current.mutateAsync({ email: "invitee@example.com", role: "member" });
    await cancelHook.result.current.mutateAsync("invitation-1");

    expect(invitationApi.create).toHaveBeenCalledWith("project-1", { email: "invitee@example.com", role: "member" });
    expect(invitationApi.cancel).toHaveBeenCalledWith("project-1", "invitation-1");
    expect(queryClient.getQueryState(invitationKeys.project("project-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(invitationKeys.user())?.isInvalidated).toBe(true);
  });

  it("accepts and declines current user invitations with broad invalidation", async () => {
    vi.mocked(invitationApi.accept).mockResolvedValue(ok({ id: "member-1" }));
    vi.mocked(invitationApi.decline).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(invitationKeys.user(), [invitation]);
    queryClient.setQueryData(projectKeys.all, []);
    queryClient.setQueryData(memberKeys.all, []);

    const acceptHook = renderHook(() => useAcceptInvitation(), { wrapper: wrapper(queryClient) });
    const declineHook = renderHook(() => useDeclineInvitation(), { wrapper: wrapper(queryClient) });

    await acceptHook.result.current.mutateAsync("invitation-1");
    await declineHook.result.current.mutateAsync("invitation-1");

    expect(invitationApi.accept).toHaveBeenCalledWith("invitation-1");
    expect(invitationApi.decline).toHaveBeenCalledWith("invitation-1");
    expect(queryClient.getQueryState(invitationKeys.user())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(projectKeys.all)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(memberKeys.all)?.isInvalidated).toBe(true);
  });
});
