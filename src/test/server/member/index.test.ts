import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { memberRepositoryMock, nanoidMock, taskRepositoryMock } = vi.hoisted(() => ({
  memberRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByProject: vi.fn(),
    findByProjectWithUsers: vi.fn(),
    findByUserAndProject: vi.fn(),
    findUserByEmail: vi.fn(),
    findUsers: vi.fn(),
    update: vi.fn(),
  },
  nanoidMock: vi.fn(),
  taskRepositoryMock: {
    clearAssignee: vi.fn(),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/repositories", () => ({
  memberRepository: memberRepositoryMock,
  taskRepository: taskRepositoryMock,
}));

const { AddMemberUseCase, ListMembersUseCase, RemoveMemberUseCase, UpdateMemberUseCase } = await import(
  "@/server/use-cases/member"
);

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const ownerMembership = {
  id: "owner-member",
  organizationId: "project-1",
  userId: "owner-user",
  role: "owner",
  createdAt,
};
const regularMembership = {
  id: "regular-member",
  organizationId: "project-1",
  userId: "regular-user",
  role: "member",
  createdAt,
};
const regularUser = { id: "regular-user", name: "Regular User", email: "regular@example.com", image: null };

describe("member use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("member-new");
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    taskRepositoryMock.clearAssignee.mockResolvedValue(ok(undefined));
  });

  it("lists project members with user details", async () => {
    memberRepositoryMock.findByProjectWithUsers.mockResolvedValue(
      ok([{ member: regularMembership, user: regularUser }]),
    );

    const result = await ListMembersUseCase.execute("owner-user", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([
      {
        id: "regular-member",
        userId: "regular-user",
        projectId: "project-1",
        role: "member",
        createdAt,
        joinedAt: createdAt,
        user: regularUser,
      },
    ]);
  });

  it("wraps member listing failures", async () => {
    memberRepositoryMock.findByProjectWithUsers.mockResolvedValue(err(new Error("read failed")));

    const result = await ListMembersUseCase.execute("owner-user", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("read failed");
    }
  });

  it("rejects member listing for non-members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await ListMembersUseCase.execute("outsider", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.findByProjectWithUsers).not.toHaveBeenCalled();
  });

  it("adds a member when requested by an owner or admin", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([regularUser]));
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));
    memberRepositoryMock.create.mockResolvedValue(ok(undefined));

    const result = await AddMemberUseCase.execute("owner-user", "project-1", {
      email: "regular@example.com",
      role: "admin",
    });

    expect(result.isOk()).toBe(true);
    expect(memberRepositoryMock.create).toHaveBeenCalledWith({
      id: "member-new",
      organizationId: "project-1",
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

  it("rejects member adds from regular members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([regularMembership]));

    const result = await AddMemberUseCase.execute("regular-user", "project-1", {
      email: "new@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns not found when adding an unknown user", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([]));

    const result = await AddMemberUseCase.execute("owner-user", "project-1", {
      email: "missing@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(memberRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("rejects adding an existing project member", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([regularUser]));
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([regularMembership]));

    const result = await AddMemberUseCase.execute("owner-user", "project-1", {
      email: "regular@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(409);
    }
    expect(memberRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("wraps member add failures", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([regularUser]));
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));
    memberRepositoryMock.create.mockResolvedValue(err(new Error("insert failed")));

    const result = await AddMemberUseCase.execute("owner-user", "project-1", {
      email: "regular@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("insert failed");
    }
  });

  it("allows only owners to update member roles", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await UpdateMemberUseCase.execute("owner-user", "project-1", "regular-member", { role: "admin" });

    expect(result.isOk()).toBe(true);
    expect(memberRepositoryMock.update).toHaveBeenCalledWith("regular-member", { role: "admin" });
    expect(result.unwrap()).toMatchObject({ id: "regular-member", role: "admin" });
  });

  it("rejects member updates from admins and members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "admin" }]));

    const result = await UpdateMemberUseCase.execute("owner-user", "project-1", "regular-member", { role: "admin" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.findById).not.toHaveBeenCalled();
  });

  it("returns not found when updating a missing member", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await UpdateMemberUseCase.execute("owner-user", "project-1", "missing-member", { role: "admin" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("does not allow changing the owner role", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([ownerMembership]));

    const result = await UpdateMemberUseCase.execute("owner-user", "project-1", "owner-member", { role: "admin" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("wraps member update failures", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.update.mockResolvedValue(err(new Error("update failed")));

    const result = await UpdateMemberUseCase.execute("owner-user", "project-1", "regular-member", { role: "admin" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("update failed");
    }
  });

  it("removes non-owner members for owners and admins", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await RemoveMemberUseCase.execute("owner-user", "project-1", "regular-member");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(taskRepositoryMock.clearAssignee).toHaveBeenCalledWith("regular-member");
    expect(memberRepositoryMock.delete).toHaveBeenCalledWith("regular-member");
  });

  it("wraps assigned task cleanup failures before removing a member", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    taskRepositoryMock.clearAssignee.mockResolvedValue(err(new Error("task update failed")));

    const result = await RemoveMemberUseCase.execute("owner-user", "project-1", "regular-member");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("task update failed");
    }
    expect(memberRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("returns not found when removing a missing member", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await RemoveMemberUseCase.execute("owner-user", "project-1", "missing-member");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(memberRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("does not allow removing the owner", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([ownerMembership]));

    const result = await RemoveMemberUseCase.execute("owner-user", "project-1", "owner-member");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it("wraps member removal failures", async () => {
    memberRepositoryMock.findById.mockResolvedValue(ok([regularMembership]));
    memberRepositoryMock.delete.mockResolvedValue(err(new Error("database unavailable")));

    const result = await RemoveMemberUseCase.execute("owner-user", "project-1", "regular-member");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("database unavailable");
    }
  });
});
