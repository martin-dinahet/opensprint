import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerVariables } from "@/server/types";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/server/lib/auth", () => ({
  auth: authMock,
}));

const { guard } = await import("@/server/lib/guard");
const { handleError } = await import("@/server/lib/handle-error");
const { handleNotFound } = await import("@/server/lib/handle-notfound");

describe("server middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 from the real auth guard without a session", async () => {
    authMock.api.getSession.mockResolvedValue(null);
    const app = new Hono<ServerVariables>().get("/guarded", guard(), (c) => c.json({ ok: true }));

    const response = await app.request("/guarded");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Not authenticated" },
    });
  });

  it("attaches user and session from the real auth guard", async () => {
    authMock.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
      session: { id: "session-1", userId: "user-1" },
    });
    const app = new Hono<ServerVariables>().get("/guarded", guard(), (c) =>
      c.json({ userId: c.get("user").id, sessionId: c.get("session").id }),
    );

    const response = await app.request("/guarded");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ userId: "user-1", sessionId: "session-1" });
  });

  it("maps unhandled errors and not found responses", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = new Hono()
      .notFound((c) => handleNotFound(c))
      .onError((error, c) => handleError(error, c))
      .get("/boom", () => {
        throw new Error("boom");
      });

    const notFoundResponse = await app.request("/missing");
    const errorResponse = await app.request("/boom");

    expect(notFoundResponse.status).toBe(404);
    await expect(notFoundResponse.json()).resolves.toEqual({
      success: false,
      errors: { root: ["Route not found"] },
    });
    expect(errorResponse.status).toBe(500);
    await expect(errorResponse.json()).resolves.toEqual({
      success: false,
      errors: { root: ["Internal server error"] },
    });

    errorSpy.mockRestore();
  });
});
