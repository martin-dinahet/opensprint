import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { boardApi, boardKeys } from "@/entities/board/api";
import { makeBoard } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useBoard, useBoards, useCreateBoard, useDeleteBoard, useReorderBoards, useUpdateBoard } from ".";

vi.mock("@/entities/board/api", () => ({
  boardKeys: {
    all: ["boards"],
    lists: () => ["boards", "list"],
    list: (projectId: string) => ["boards", "list", projectId],
    details: () => ["boards", "detail"],
    detail: (id: string) => ["boards", "detail", id],
  },
  boardApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
  },
}));

describe("board hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads boards with the project query key", async () => {
    vi.mocked(boardApi.list).mockResolvedValue(ok({ boards: [makeBoard()] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useBoards("project-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([makeBoard()]);
    expect(boardApi.list).toHaveBeenCalledWith("project-1");
    expect(queryClient.getQueryData(boardKeys.list("project-1"))).toEqual([makeBoard()]);
  });

  it("does not load boards without a project id", () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useBoards(""), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(boardApi.list).not.toHaveBeenCalled();
  });

  it("loads a board detail only when both ids are present", async () => {
    vi.mocked(boardApi.get).mockResolvedValue(ok(makeBoard()));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useBoard("project-1", "board-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(makeBoard());
    expect(boardApi.get).toHaveBeenCalledWith("project-1", "board-1");
    expect(queryClient.getQueryData(boardKeys.detail("board-1"))).toEqual(makeBoard());
  });

  it("invalidates board lists after creating a board", async () => {
    vi.mocked(boardApi.create).mockResolvedValue(ok(makeBoard({ id: "board-new" })));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateBoard(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ projectId: "project-1", data: { name: "Doing" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(boardApi.create).toHaveBeenCalledWith("project-1", { name: "Doing" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.list("project-1") });
  });

  it("invalidates list and detail queries after updating a board", async () => {
    vi.mocked(boardApi.update).mockResolvedValue(ok({ ...makeBoard(), updatedAt: "2026-01-02T00:00:00.000Z" }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateBoard(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ projectId: "project-1", boardId: "board-1", data: { name: "Updated" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.list("project-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.detail("board-1") });
  });

  it("invalidates board lists after deleting and reordering boards", async () => {
    vi.mocked(boardApi.delete).mockResolvedValue(ok({ success: true }));
    vi.mocked(boardApi.reorder).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const deleteHook = renderHook(() => useDeleteBoard(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    deleteHook.result.current.mutate({ projectId: "project-1", boardId: "board-1" });
    await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true));

    const reorderHook = renderHook(() => useReorderBoards(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    reorderHook.result.current.mutate({ projectId: "project-1", boardIds: ["board-2", "board-1"] });
    await waitFor(() => expect(reorderHook.result.current.isSuccess).toBe(true));

    expect(boardApi.delete).toHaveBeenCalledWith("project-1", "board-1");
    expect(boardApi.reorder).toHaveBeenCalledWith("project-1", { boardIds: ["board-2", "board-1"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.list("project-1") });
  });
});
