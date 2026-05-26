import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectApi, projectKeys } from "@/entities/project";
import { makeProject } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useCreateProject, useDeleteProject, useProject, useProjects, useUpdateProject } from ".";

vi.mock("@/entities/project", () => ({
  projectKeys: {
    all: ["projects"],
    lists: () => ["projects", "list"],
    list: (filters?: string) => ["projects", "list", filters],
    details: () => ["projects", "detail"],
    detail: (id: string) => ["projects", "detail", id],
  },
  projectApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("project hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads projects with the list query key", async () => {
    vi.mocked(projectApi.list).mockResolvedValue(ok({ projects: [makeProject()] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProjects(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([makeProject()]);
    expect(projectApi.list).toHaveBeenCalledWith();
    expect(queryClient.getQueryData(projectKeys.list())).toEqual([makeProject()]);
  });

  it("loads project detail only when an id is present", async () => {
    vi.mocked(projectApi.get).mockResolvedValue(ok(makeProject()));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProject("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(makeProject());
    expect(projectApi.get).toHaveBeenCalledWith("project-1");
    expect(queryClient.getQueryData(projectKeys.detail("project-1"))).toEqual(makeProject());
  });

  it("does not load project detail without an id", () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useProject(""), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(projectApi.get).not.toHaveBeenCalled();
  });

  it("invalidates project queries after creating a project", async () => {
    vi.mocked(projectApi.create).mockResolvedValue(ok(makeProject({ id: "project-new" })));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ name: "New project", defaultBoardName: "Roadmap", description: "Detailed enough" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectApi.create).toHaveBeenCalledWith({
      name: "New project",
      defaultBoardName: "Roadmap",
      description: "Detailed enough",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });

  it("invalidates list and detail queries after updating a project", async () => {
    vi.mocked(projectApi.update).mockResolvedValue(
      ok({
        id: "project-1",
        name: "Updated",
        description: null,
        status: "active",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    );
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ id: "project-1", data: { name: "Updated" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectApi.update).toHaveBeenCalledWith("project-1", { name: "Updated" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.detail("project-1") });
  });

  it("invalidates project queries after deleting a project", async () => {
    vi.mocked(projectApi.delete).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate("project-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(projectApi.delete).toHaveBeenCalledWith("project-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });
});
