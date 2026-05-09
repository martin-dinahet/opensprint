import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    projects: {
      ":id": {
        members: {
          $get: vi.fn(),
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
});
