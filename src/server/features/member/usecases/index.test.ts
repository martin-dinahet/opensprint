import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { memberRepositoryMock, nanoidMock } = vi.hoisted(() => ({
  memberRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByProject: vi.fn(),
    findByUserAndProject: vi.fn(),
    findUserByEmail: vi.fn(),
    findUsers: vi.fn(),
    update: vi.fn(),
  },
  nanoidMock: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/features/member/repositories", () => ({
  memberRepository: memberRepositoryMock,
}));

const { addMember, listMembers, removeMember, updateMember } = await import("@/server/features/member/usecases");

const joinedAt = new Date("2026-01-01T00:00:00.000Z");
const ownerMembership = { id: "owner-member", projectId: "project-1", userId: "owner-user", role: "owner", joinedAt };
const regularMembership = {
  id: "regular-member",
  projectId: "project-1",
  userId: "regular-user",
  role: "member",
  joinedAt,
};
const regularUser = { id: "regular-user", name: "Regular User", email: "regular@example.com", image: null };

describe("member use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("member-new");
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
  });

  it("lists project members with user details", async () => {
    memberRepositoryMock.findByProject.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.findUsers.mockResolvedValue(ok([regularUser]));

    const result = await listMembers("owner-user", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([
      {
        id: "regular-member",
        userId: "regular-user",
        projectId: "project-1",
        role: "member",
        joinedAt,
        user: regularUser,
      },
    ]);
  });

  it("rejects member listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await listMembers("outsider", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.findByProject).not.toHaveBeenCalled();
  });

  it("adds a member when requested by an owner or admin", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([regularUser]));
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));
    memberRepositoryMock.create.mockResolvedValue(ok(undefined));

    const result = await addMember("owner-user", "project-1", { email: "regular@example.com", role: "admin" });

    expect(result.isOk()).toBe(true);
    expect(memberRepositoryMock.create).toHaveBeenCalledWith({
      id: "member-new",
      projectId: "project-1",
      userId: "regular-user",
      role: "admin",
    });
    expect(result.unwrap()).toMatchObject({
      id: "member-new",
      userId: "regular-user",
      projectId: "project-1",
      role: "admin",
    });
  });

  it("rejects adding an existing project member", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([regularUser]));
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([regularMembership]));

    const result = await addMember("owner-user", "project-1", { email: "regular@example.com", role: "member" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(409);
    }
    expect(memberRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("allows only owners to update member roles", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateMember("owner-user", "project-1", "regular-member", { role: "admin" });

    expect(result.isOk()).toBe(true);
    expect(memberRepositoryMock.update).toHaveBeenCalledWith("regular-member", { role: "admin" });
    expect(result.unwrap()).toMatchObject({ id: "regular-member", role: "admin" });
  });

  it("does not allow changing the owner role", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([ownerMembership]));

    const result = await updateMember("owner-user", "project-1", "owner-member", { role: "admin" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("removes non-owner members for owners and admins", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await removeMember("owner-user", "project-1", "regular-member");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(memberRepositoryMock.delete).toHaveBeenCalledWith("regular-member");
  });

  it("wraps member removal failures", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.delete.mockResolvedValue(err(new Error("database unavailable")));

    const result = await removeMember("owner-user", "project-1", "regular-member");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("database unavailable");
    }
  });
});
