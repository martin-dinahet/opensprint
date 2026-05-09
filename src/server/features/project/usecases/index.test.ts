import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { memberRepositoryMock, nanoidMock, projectRepositoryMock } = vi.hoisted(() => ({
  memberRepositoryMock: {
    create: vi.fn(),
    deleteByProject: vi.fn(),
    findByUserAndProject: vi.fn(),
    findByUserId: vi.fn(),
  },
  nanoidMock: vi.fn(),
  projectRepositoryMock: {
    create: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/features/member/repositories", () => ({
  memberRepository: memberRepositoryMock,
}));

vi.mock("@/server/features/project/repositories", () => ({
  projectRepository: projectRepositoryMock,
}));

const { createProject, deleteProject, getProject, listProjects, updateProject } = await import(
  "@/server/features/project/usecases"
);

const now = new Date("2026-01-01T00:00:00.000Z");
const project = {
  id: "project-1",
  name: "Launch",
  description: "Launch project",
  createdAt: now,
  updatedAt: now,
};
const ownerMembership = { id: "member-1", projectId: "project-1", userId: "user-1", role: "owner" };

describe("project use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReset();
  });

  it("lists projects for the user's memberships", async () => {
    memberRepositoryMock.findByUserId.mockResolvedValue(ok([ownerMembership]));
    projectRepositoryMock.findByIds.mockResolvedValue(ok([project]));

    const result = await listProjects("user-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([project]);
    expect(projectRepositoryMock.findByIds).toHaveBeenCalledWith(["project-1"]);
  });

  it("returns an empty project list for users without memberships", async () => {
    memberRepositoryMock.findByUserId.mockResolvedValue(ok([]));

    const result = await listProjects("user-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([]);
    expect(projectRepositoryMock.findByIds).not.toHaveBeenCalled();
  });

  it("creates a project and owner membership", async () => {
    nanoidMock.mockReturnValueOnce("project-new").mockReturnValueOnce("member-new");
    projectRepositoryMock.create.mockResolvedValue(ok(undefined));
    memberRepositoryMock.create.mockResolvedValue(ok(undefined));

    const result = await createProject("user-1", { name: "New Project", description: "Useful description" });

    expect(result.isOk()).toBe(true);
    expect(projectRepositoryMock.create).toHaveBeenCalledWith({
      id: "project-new",
      name: "New Project",
      description: "Useful description",
    });
    expect(memberRepositoryMock.create).toHaveBeenCalledWith({
      id: "member-new",
      projectId: "project-new",
      userId: "user-1",
      role: "owner",
    });
    expect(result.unwrap()).toEqual({
      id: "project-new",
      name: "New Project",
      description: "Useful description",
    });
  });

  it("wraps project creation failures", async () => {
    nanoidMock.mockReturnValueOnce("project-new").mockReturnValueOnce("member-new");
    projectRepositoryMock.create.mockResolvedValue(err(new Error("database unavailable")));

    const result = await createProject("user-1", { name: "New Project" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("database unavailable");
    }
  });

  it("wraps owner membership creation failures", async () => {
    nanoidMock.mockReturnValueOnce("project-new").mockReturnValueOnce("member-new");
    projectRepositoryMock.create.mockResolvedValue(ok(undefined));
    memberRepositoryMock.create.mockResolvedValue(err(new Error("member insert failed")));

    const result = await createProject("user-1", { name: "New Project" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("member insert failed");
    }
  });

  it("gets a project only when the user is a member", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));

    const result = await getProject("user-1", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(project);
  });

  it("returns not found when a project does not exist", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([]));

    const result = await getProject("user-1", "missing-project");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
    expect(memberRepositoryMock.findByUserAndProject).not.toHaveBeenCalled();
  });

  it("rejects project reads for non-members", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));

    const result = await getProject("user-2", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
  });

  it("updates projects for owners and admins", async () => {
    projectRepositoryMock.findById
      .mockResolvedValueOnce(ok([project]))
      .mockResolvedValueOnce(ok([{ ...project, name: "Updated" }]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    projectRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateProject("user-1", "project-1", { name: "Updated" });

    expect(result.isOk()).toBe(true);
    expect(projectRepositoryMock.update).toHaveBeenCalledWith("project-1", {
      name: "Updated",
      description: undefined,
    });
    expect(result.unwrap()).toMatchObject({ id: "project-1", name: "Updated" });
  });

  it("rejects project updates from regular members", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await updateProject("user-1", "project-1", { name: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(projectRepositoryMock.update).not.toHaveBeenCalled();
  });

  it("wraps project update failures", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    projectRepositoryMock.update.mockResolvedValue(err(new Error("update failed")));

    const result = await updateProject("user-1", "project-1", { name: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("update failed");
    }
  });

  it("returns not found when the updated project cannot be reloaded", async () => {
    projectRepositoryMock.findById.mockResolvedValueOnce(ok([project])).mockResolvedValueOnce(ok([]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    projectRepositoryMock.update.mockResolvedValue(ok(undefined));

    const result = await updateProject("user-1", "project-1", { name: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("deletes projects for owners", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    memberRepositoryMock.deleteByProject.mockResolvedValue(ok(undefined));
    projectRepositoryMock.delete.mockResolvedValue(ok(undefined));

    const result = await deleteProject("user-1", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ success: true });
    expect(memberRepositoryMock.deleteByProject).toHaveBeenCalledWith("project-1");
    expect(projectRepositoryMock.delete).toHaveBeenCalledWith("project-1");
  });

  it("rejects project deletes from non-owners", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "admin" }]));

    const result = await deleteProject("user-1", "project-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(403);
    }
    expect(memberRepositoryMock.deleteByProject).not.toHaveBeenCalled();
  });
});
