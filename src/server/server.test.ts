import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHonoTestClient } from "@/test/backend";
import { makeProject, makeUser } from "@/test/factories";
import { AppError } from "./features/shared/errors";

const { authMock, projectUseCasesMock } = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
  projectUseCasesMock: {
    createProject: vi.fn(),
    deleteProject: vi.fn(),
    getProject: vi.fn(),
    listProjects: vi.fn(),
    updateProject: vi.fn(),
  },
}));

vi.mock("@/server/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/server/features/project/usecases", () => projectUseCasesMock);

const { server } = await import("@/server");

describe("server routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.api.getSession.mockResolvedValue({
      user: makeUser(),
      session: { id: "session-1", userId: "user-1" },
    });
  });

  it("responds to health checks through app.request", async () => {
    const response = await server.request("/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "OK" });
  });

  it("lists projects through Hono testClient", async () => {
    projectUseCasesMock.listProjects.mockResolvedValue(ok([makeProject()]));

    const client = createHonoTestClient(server);
    const response = await client.api.projects.$get();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ projects: [makeProject()] });
    expect(projectUseCasesMock.listProjects).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when a guarded route has no session", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const client = createHonoTestClient(server);
    const response = await client.api.projects.$get();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Not authenticated" },
    });
  });

  it("validates project create bodies", async () => {
    const client = createHonoTestClient(server);
    const response = await client.api.projects.$post({ json: { name: "x" } });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ success: false });
    expect(projectUseCasesMock.createProject).not.toHaveBeenCalled();
  });

  it("maps use case errors to route responses", async () => {
    projectUseCasesMock.getProject.mockResolvedValue(err(new AppError("project-not-found", "Project not found", 404)));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$get({ param: { id: "missing-project" } });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Project not found" },
    });
  });

  it("passes params and validated bodies to update use cases", async () => {
    projectUseCasesMock.updateProject.mockResolvedValue(
      ok({ id: "project-1", name: "Updated", description: null, updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
    );

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$patch({
      param: { id: "project-1" },
      json: { name: "Updated" },
    });

    expect(response.status).toBe(200);
    expect(projectUseCasesMock.updateProject).toHaveBeenCalledWith("user-1", "project-1", { name: "Updated" });
  });
});
