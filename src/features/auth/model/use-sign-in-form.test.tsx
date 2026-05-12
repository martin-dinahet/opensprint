import { err, ok } from "@punpun-dev/ts-result";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInEmail } from "../api/sign-in-email";
import { useSignInForm } from "./use-sign-in-form";

const { pushMock, signInEmailMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signInEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../api/sign-in-email", () => ({
  signInEmail: signInEmailMock,
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useSignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates form fields without submitting", async () => {
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.action(makeFormData({ email: "not-email", password: "" }));
    });

    await waitFor(() => expect(result.current.fieldErrors?.email).toBeDefined());

    expect(signInEmail).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows global auth errors", async () => {
    signInEmailMock.mockResolvedValue(err({ message: "Invalid credentials" }));
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.action(makeFormData({ email: "user@example.com", password: "password-1" }));
    });

    await waitFor(() => expect(result.current.globalError).toBe("Invalid credentials"));

    expect(signInEmail).toHaveBeenCalledWith("user@example.com", "password-1");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to the dashboard after successful sign in", async () => {
    signInEmailMock.mockResolvedValue(ok(undefined));
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.action(makeFormData({ email: "user@example.com", password: "password-1" }));
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));

    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.globalError).toBeNull();
  });
});
