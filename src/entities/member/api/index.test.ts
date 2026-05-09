import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    projects: {
      ":id": {
        members: {
          $get: vi.fn(),
          $post: vi.fn(),
          ":memberId": {
            $patch: vi.fn(),
            $delete: vi.fn(),
          },
        },
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

vi.mock("@/shared/api/client", () => ({
  api: apiMock,
}));

vi.mock("@/shared/api/result", () => ({
  requestApiResult: requestApiResultMock,
}));

const { memberApi, memberKeys } = await import(".");

describe("member API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(memberKeys.all).toEqual(["members"]);
    expect(memberKeys.lists()).toEqual(["members", "list"]);
    expect(memberKeys.list("project-1")).toEqual(["members", "list", "project-1"]);
  });

  it("lists members and normalizes missing arrays", async () => {
    apiMock.projects[":id"].members.$get.mockResolvedValue({});

    const result = await memberApi.list("project-1");

    expect(result.unwrap()).toEqual({ members: [] });
    expect(apiMock.projects[":id"].members.$get).toHaveBeenCalledWith({ param: { id: "project-1" } });
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch project members",
      expect.any(Function),
    );
  });

  it("adds members with project params and request body", async () => {
    apiMock.projects[":id"].members.$post.mockResolvedValue({ id: "member-1" });

    await memberApi.add("project-1", { email: "teammate@example.com", role: "member" });

    expect(apiMock.projects[":id"].members.$post).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { email: "teammate@example.com", role: "member" },
    });
    expect(requestApiResultMock).toHaveBeenCalledWith(expect.any(Function), "Failed to add project member");
  });

  it("updates member roles with route params", async () => {
    apiMock.projects[":id"].members[":memberId"].$patch.mockResolvedValue({ id: "member-1" });

    await memberApi.update("project-1", "member-1", { role: "admin" });

    expect(apiMock.projects[":id"].members[":memberId"].$patch).toHaveBeenCalledWith({
      param: { id: "project-1", memberId: "member-1" },
      json: { role: "admin" },
    });
    expect(requestApiResultMock).toHaveBeenCalledWith(expect.any(Function), "Failed to update project member");
  });

  it("removes members with route params", async () => {
    apiMock.projects[":id"].members[":memberId"].$delete.mockResolvedValue({ success: true });

    await memberApi.remove("project-1", "member-1");

    expect(apiMock.projects[":id"].members[":memberId"].$delete).toHaveBeenCalledWith({
      param: { id: "project-1", memberId: "member-1" },
    });
    expect(requestApiResultMock).toHaveBeenCalledWith(expect.any(Function), "Failed to remove project member");
  });
});
