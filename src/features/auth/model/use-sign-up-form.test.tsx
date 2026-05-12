import { err, ok } from "@punpun-dev/ts-result";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signUpEmail } from "../api/sign-up-email";
import { useSignUpForm } from "./use-sign-up-form";

const { pushMock, signUpEmailMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signUpEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../api/sign-up-email", () => ({
  signUpEmail: signUpEmailMock,
}));

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useSignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates form fields without submitting", async () => {
    const { result } = renderHook(() => useSignUpForm());

    act(() => {
      result.current.action(
        makeFormData({
          confirmPassword: "different-password",
          email: "not-email",
          name: "",
          password: "short",
        }),
      );
    });

    await waitFor(() => expect(result.current.fieldErrors?.email).toBeDefined());

    expect(result.current.fieldErrors?.name).toEqual(["Name is required"]);
    expect(result.current.fieldErrors?.password).toEqual(["Password must be at least 8 characters"]);
    expect(result.current.fieldErrors?.confirmPassword).toEqual(["Passwords do not match"]);
    expect(signUpEmail).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows global auth errors", async () => {
    signUpEmailMock.mockResolvedValue(err({ message: "Email already exists" }));
    const { result } = renderHook(() => useSignUpForm());

    act(() => {
      result.current.action(
        makeFormData({
          confirmPassword: "password-1",
          email: "user@example.com",
          name: "Test User",
          password: "password-1",
        }),
      );
    });

    await waitFor(() => expect(result.current.globalError).toBe("Email already exists"));

    expect(signUpEmail).toHaveBeenCalledWith("user@example.com", "Test User", "password-1");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to the dashboard after successful sign up", async () => {
    signUpEmailMock.mockResolvedValue(ok(undefined));
    const { result } = renderHook(() => useSignUpForm());

    act(() => {
      result.current.action(
        makeFormData({
          confirmPassword: "password-1",
          email: "user@example.com",
          name: "Test User",
          password: "password-1",
        }),
      );
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));

    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.globalError).toBeNull();
  });
});
