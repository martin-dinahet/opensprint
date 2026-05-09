import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { columnApi, columnKeys } from "@/entities/column/api";
import { makeColumn } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useColumn, useColumns, useCreateColumn, useDeleteColumn, useReorderColumns, useUpdateColumn } from ".";

vi.mock("@/entities/column/api", () => ({
  columnKeys: {
    all: ["columns"],
    lists: () => ["columns", "list"],
    list: (boardId: string) => ["columns", "list", boardId],
    details: () => ["columns", "detail"],
    detail: (id: string) => ["columns", "detail", id],
  },
  columnApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
  },
}));

describe("column hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads columns with the board query key", async () => {
    vi.mocked(columnApi.list).mockResolvedValue(ok({ columns: [makeColumn()] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useColumns("board-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([makeColumn()]);
    expect(columnApi.list).toHaveBeenCalledWith("board-1");
    expect(queryClient.getQueryData(columnKeys.list("board-1"))).toEqual([makeColumn()]);
  });

  it("does not load columns without a board id", () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useColumns(""), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(columnApi.list).not.toHaveBeenCalled();
  });

  it("loads a column detail only when both ids are present", async () => {
    vi.mocked(columnApi.get).mockResolvedValue(ok(makeColumn()));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useColumn("board-1", "column-1"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(makeColumn());
    expect(columnApi.get).toHaveBeenCalledWith("board-1", "column-1");
    expect(queryClient.getQueryData(columnKeys.detail("column-1"))).toEqual(makeColumn());
  });

  it("invalidates column lists after creating a column", async () => {
    vi.mocked(columnApi.create).mockResolvedValue(ok(makeColumn({ id: "column-new" })));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateColumn(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ boardId: "board-1", data: { name: "Doing" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(columnApi.create).toHaveBeenCalledWith("board-1", { name: "Doing" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: columnKeys.list("board-1") });
  });

  it("invalidates list and detail queries after updating a column", async () => {
    vi.mocked(columnApi.update).mockResolvedValue(ok({ ...makeColumn(), updatedAt: "2026-01-02T00:00:00.000Z" }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateColumn(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ boardId: "board-1", columnId: "column-1", data: { name: "Updated" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: columnKeys.list("board-1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: columnKeys.detail("column-1") });
  });

  it("invalidates column lists after deleting and reordering columns", async () => {
    vi.mocked(columnApi.delete).mockResolvedValue(ok({ success: true }));
    vi.mocked(columnApi.reorder).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const deleteHook = renderHook(() => useDeleteColumn(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    deleteHook.result.current.mutate({ boardId: "board-1", columnId: "column-1" });
    await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true));

    const reorderHook = renderHook(() => useReorderColumns(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    reorderHook.result.current.mutate({ boardId: "board-1", columnIds: ["column-2", "column-1"] });
    await waitFor(() => expect(reorderHook.result.current.isSuccess).toBe(true));

    expect(columnApi.delete).toHaveBeenCalledWith("board-1", "column-1");
    expect(columnApi.reorder).toHaveBeenCalledWith("board-1", { columnIds: ["column-2", "column-1"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: columnKeys.list("board-1") });
  });
});
