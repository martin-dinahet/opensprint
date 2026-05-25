import { ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock, requestApiResultMock } = vi.hoisted(() => ({
  apiMock: {
    invitations: {
      $get: vi.fn(),
      ":invitationId": {
        accept: { $post: vi.fn() },
        decline: { $post: vi.fn() },
      },
    },
    projects: {
      ":id": {
        invitations: {
          $get: vi.fn(),
          $post: vi.fn(),
          ":invitationId": {
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

vi.mock("@/shared", () => ({
  api: apiMock,
  requestApiResult: requestApiResultMock,
}));

const { invitationApi, invitationKeys } = await import(".");

describe("invitation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds stable query keys", () => {
    expect(invitationKeys.all).toEqual(["invitations"]);
    expect(invitationKeys.user()).toEqual(["invitations", "user"]);
    expect(invitationKeys.projects()).toEqual(["invitations", "project"]);
    expect(invitationKeys.project("project-1")).toEqual(["invitations", "project", "project-1"]);
  });

  it("lists user invitations and normalizes missing arrays", async () => {
    apiMock.invitations.$get.mockResolvedValue({});

    const result = await invitationApi.listUser();

    expect(result.unwrap()).toEqual({ invitations: [] });
    expect(apiMock.invitations.$get).toHaveBeenCalledWith();
    expect(requestApiResultMock).toHaveBeenCalledWith(
      expect.any(Function),
      "Failed to fetch invitations",
      expect.any(Function),
    );
  });

  it("lists project invitations with project params", async () => {
    apiMock.projects[":id"].invitations.$get.mockResolvedValue({});

    const result = await invitationApi.listProject("project-1");

    expect(result.unwrap()).toEqual({ invitations: [] });
    expect(apiMock.projects[":id"].invitations.$get).toHaveBeenCalledWith({ param: { id: "project-1" } });
  });

  it("creates, cancels, accepts, and declines invitations", async () => {
    apiMock.projects[":id"].invitations.$post.mockResolvedValue({ id: "invitation-1" });
    apiMock.projects[":id"].invitations[":invitationId"].$delete.mockResolvedValue({ success: true });
    apiMock.invitations[":invitationId"].accept.$post.mockResolvedValue({ id: "member-1" });
    apiMock.invitations[":invitationId"].decline.$post.mockResolvedValue({ success: true });

    await invitationApi.create("project-1", { email: "invitee@example.com", role: "member" });
    await invitationApi.cancel("project-1", "invitation-1");
    await invitationApi.accept("invitation-1");
    await invitationApi.decline("invitation-1");

    expect(apiMock.projects[":id"].invitations.$post).toHaveBeenCalledWith({
      param: { id: "project-1" },
      json: { email: "invitee@example.com", role: "member" },
    });
    expect(apiMock.projects[":id"].invitations[":invitationId"].$delete).toHaveBeenCalledWith({
      param: { id: "project-1", invitationId: "invitation-1" },
    });
    expect(apiMock.invitations[":invitationId"].accept.$post).toHaveBeenCalledWith({
      param: { invitationId: "invitation-1" },
    });
    expect(apiMock.invitations[":invitationId"].decline.$post).toHaveBeenCalledWith({
      param: { invitationId: "invitation-1" },
    });
  });
});
