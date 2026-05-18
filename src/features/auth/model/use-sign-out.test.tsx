import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared";
import { useSignOut } from "./use-sign-out";

const { refreshMock, replaceMock, signOutMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/shared", async () => {
  const actual = await vi.importActual<typeof import("@/shared")>("@/shared");
  return {
    ...actual,
    authClient: {
      signOut: signOutMock,
    },
  };
});

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out, redirects to sign in, and refreshes the router", async () => {
    signOutMock.mockResolvedValue({});
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.action();
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/sign-in"));

    expect(authClient.signOut).toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("shows thrown auth client failures", async () => {
    signOutMock.mockRejectedValue(new Error("Network failed"));
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.action();
    });

    await waitFor(() => expect(result.current.error).toBe("Network failed"));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows response-level auth failures and exposes pending icon state", async () => {
    signOutMock.mockResolvedValue({ error: { message: "Session already expired" } });
    const { result } = renderHook(() => useSignOut());

    expect(result.current.icon.displayName ?? result.current.icon.name).toContain("Logout");

    act(() => {
      result.current.action();
    });

    await waitFor(() => expect(result.current.error).toBe("Session already expired"));

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
