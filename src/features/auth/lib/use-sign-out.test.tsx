import { err, ok } from "@punpun-dev/ts-result";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared/lib/auth-client";
import { useSignOut } from "./use-sign-out";

const { handleClientResultMock, refreshMock, replaceMock, signOutMock } = vi.hoisted(() => ({
  handleClientResultMock: vi.fn(),
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, replace: replaceMock }),
}));

vi.mock("@/shared/api/result", () => ({
  handleClientResult: handleClientResultMock,
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signOut: signOutMock,
  },
}));

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleClientResultMock.mockImplementation(async (request: () => Promise<unknown>) => ok(await request()));
    signOutMock.mockResolvedValue({ error: null });
  });

  it("navigates to sign in after successful sign out without refreshing the stale route", async () => {
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.action();
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/sign-in"));

    expect(authClient.signOut).toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("shows sign out errors without navigating", async () => {
    handleClientResultMock.mockResolvedValue(err(new Error("Unable to sign out")));
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.action();
    });

    await waitFor(() => expect(result.current.error).toBe("Unable to sign out"));

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
