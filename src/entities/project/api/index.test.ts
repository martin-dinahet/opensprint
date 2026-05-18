import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    projects: {
      $get: vi.fn(),
      $post: vi.fn(),
      ":id": {
        $delete: vi.fn(),
        $get: vi.fn(),
        $patch: vi.fn(),
      },
    },
  },
  requestApiResultMock: vi.fn(
    async (request: () => Promise<unknown>, _message: string, readData?: (body: unknown) => unknown) => {
      const body = await request();
      return ok(readData ? readData(body) : body);
    },
  ),
}));

vi.mock("@/shared", () => ({
  api: apiMock,
  requestApiResult: requestApiResultMock,
}));

const { projectApi, projectKeys } = await import(".");

describe("project API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(projectKeys.all).toEqual(["projects"]);
    expect(projectKeys.lists()).toEqual(["projects", "list"]);
    expect(projectKeys.list()).toEqual(["projects", "list", undefined]);
    expect(projectKeys.list("owned")).toEqual(["projects", "list", "owned"]);
    expect(projectKeys.details()).toEqual(["projects", "detail"]);
    expect(projectKeys.detail("project-1")).toEqual(["projects", "detail", "project-1"]);
  });

  it("lists projects and normalizes missing arrays", async () => {
    apiMock.projects.$get.mockResolvedValue({});

    const result = await projectApi.list();

    expect(result.unwrap()).toEqual({ projects: [] });
    expect(apiMock.projects.$get).toHaveBeenCalledWith();
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch projects",
      expect.any(Function),
    );
  });

  it("passes params and bodies to project requests", async () => {
    apiMock.projects[":id"].$get.mockResolvedValue({ id: "project-1" });
    apiMock.projects.$post.mockResolvedValue({ id: "project-new" });
    apiMock.projects[":id"].$patch.mockResolvedValue({ id: "project-1" });
    apiMock.projects[":id"].$delete.mockResolvedValue({ success: true });

    await projectApi.get("project-1");
    await projectApi.create({ name: "New project", description: "Detailed enough" });
    await projectApi.update("project-1", { name: "Updated" });
    await projectApi.delete("project-1");

    expect(apiMock.projects[":id"].$get).toHaveBeenCalledWith({ param: { id: "project-1" } });
    expect(apiMock.projects.$post).toHaveBeenCalledWith({
      json: { name: "New project", description: "Detailed enough" },
    });
    expect(apiMock.projects[":id"].$patch).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { name: "Updated" },
    });
    expect(apiMock.projects[":id"].$delete).toHaveBeenCalledWith({ param: { id: "project-1" } });
  });
});
