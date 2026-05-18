import { ok } from "@punpun-dev/ts-result";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { columnApi, columnKeys } from "@/entities/column";
import { makeColumn } from "@/test/factories";
import { createTestQueryClient } from "@/test/render";
import { useColumns, useCreateColumn, useDeleteColumn, useUpdateColumn } from ".";

vi.mock("@/entities/column", () => ({
  columnKeys: {
    all: ["columns"],
    lists: () => ["columns", "list"],
    list: (projectId: string) => ["columns", "list", projectId],
  },
  columnApi: {
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
  },
}));

function wrapper(queryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("column hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads columns with the project query key", async () => {
    const columns = [makeColumn()];
    vi.mocked(columnApi.list).mockResolvedValue(ok({ columns }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useColumns("project-1"), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(columns);
    expect(columnApi.list).toHaveBeenCalledWith("project-1");
    expect(queryClient.getQueryData(columnKeys.list("project-1"))).toEqual(columns);
  });

  it("does not load columns without a project id", () => {
    const { result } = renderHook(() => useColumns(""), { wrapper: wrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(columnApi.list).not.toHaveBeenCalled();
  });

  it("invalidates column lists after create, update, and delete", async () => {
    vi.mocked(columnApi.create).mockResolvedValue(ok(makeColumn({ id: "column-new" })));
    vi.mocked(columnApi.update).mockResolvedValue(ok({ ...makeColumn(), updatedAt: "2026-01-02T00:00:00.000Z" }));
    vi.mocked(columnApi.delete).mockResolvedValue(ok({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const createHook = renderHook(() => useCreateColumn(), { wrapper: wrapper(queryClient) });
    createHook.result.current.mutate({ projectId: "project-1", data: { name: "Doing" } });
    await waitFor(() => expect(createHook.result.current.isSuccess).toBe(true));

    const updateHook = renderHook(() => useUpdateColumn(), { wrapper: wrapper(queryClient) });
    updateHook.result.current.mutate({ projectId: "project-1", columnId: "column-1", data: { name: "Done" } });
    await waitFor(() => expect(updateHook.result.current.isSuccess).toBe(true));

    const deleteHook = renderHook(() => useDeleteColumn(), { wrapper: wrapper(queryClient) });
    deleteHook.result.current.mutate({ projectId: "project-1", columnId: "column-1" });
    await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true));

    expect(columnApi.create).toHaveBeenCalledWith("project-1", { name: "Doing" });
    expect(columnApi.update).toHaveBeenCalledWith("project-1", "column-1", { name: "Done" });
    expect(columnApi.delete).toHaveBeenCalledWith("project-1", "column-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: columnKeys.list("project-1") });
  });
});
