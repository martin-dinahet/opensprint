import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared/lib/auth-client";
import { signUpEmail } from "./sign-up-email";

const { authClientMock, handleClientResultMock } = vi.hoisted(() => ({
  authClientMock: {
    signUp: {
      email: vi.fn(),
    },
  },
  handleClientResultMock: vi.fn(async (fn: () => Promise<unknown>) => ok(await fn())),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: authClientMock,
}));

vi.mock("@/shared/api/result", () => ({
  handleClientResult: handleClientResultMock,
}));

describe("signUpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleClientResultMock.mockImplementation(async (fn: () => Promise<unknown>) => ok(await fn()));
  });

  it("signs up with email, name, and password", async () => {
    authClientMock.signUp.email.mockResolvedValue({ error: null });

    const result = await signUpEmail("user@example.com", "Test User", "password-1");

    expect(result.unwrap()).toBeUndefined();
    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "Test User",
      password: "password-1",
    });
    expect(handleClientResultMock).toHaveBeenCalledWith(expect.any(Function), "Unable to sign up");
  });

  it("returns better-auth errors", async () => {
    authClientMock.signUp.email.mockResolvedValue({ error: { message: "Email already exists" } });

    const result = await signUpEmail("user@example.com", "Test User", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Email already exists" });
  });

  it("falls back when better-auth omits an error message", async () => {
    authClientMock.signUp.email.mockResolvedValue({ error: {} });

    const result = await signUpEmail("user@example.com", "Test User", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Unable to sign up" });
  });

  it("returns client result failures", async () => {
    handleClientResultMock.mockResolvedValue(err(new Error("Network failed")));

    const result = await signUpEmail("user@example.com", "Test User", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Network failed" });
    expect(authClientMock.signUp.email).not.toHaveBeenCalled();
  });
});
