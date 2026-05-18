import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared";
import { signInEmail } from "./sign-in-email";

const { authClientMock, handleClientResultMock } = vi.hoisted(() => ({
  authClientMock: {
    signIn: {
      email: vi.fn(),
    },
  },
  handleClientResultMock: vi.fn(async (fn: () => Promise<unknown>) => ok(await fn())),
}));

vi.mock("@/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared")>();

  return {
    ...actual,
    authClient: authClientMock,
    handleClientResult: handleClientResultMock,
  };
});

describe("signInEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleClientResultMock.mockImplementation(async (fn: () => Promise<unknown>) => ok(await fn()));
  });

  it("signs in with email and password", async () => {
    authClientMock.signIn.email.mockResolvedValue({ error: null });

    const result = await signInEmail("user@example.com", "password-1");

    expect(result.unwrap()).toBeUndefined();
    expect(authClient.signIn.email).toHaveBeenCalledWith({ email: "user@example.com", password: "password-1" });
    expect(handleClientResultMock).toHaveBeenCalledWith(expect.any(Function), "Unable to sign in");
  });

  it("returns better-auth errors", async () => {
    authClientMock.signIn.email.mockResolvedValue({ error: { message: "Invalid credentials" } });

    const result = await signInEmail("user@example.com", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Invalid credentials" });
  });

  it("falls back when better-auth omits an error message", async () => {
    authClientMock.signIn.email.mockResolvedValue({ error: {} });

    const result = await signInEmail("user@example.com", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Unable to sign in" });
  });

  it("returns client result failures", async () => {
    handleClientResultMock.mockResolvedValue(err(new Error("Network failed")));

    const result = await signInEmail("user@example.com", "password-1");

    expect(result.isErr()).toBe(true);
    expect(result.error).toEqual({ message: "Network failed" });
    expect(authClientMock.signIn.email).not.toHaveBeenCalled();
  });
});
