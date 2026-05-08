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
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(500);
    expect(result.error.message).toContain("database unavailable");
  });

  it("gets a project only when the user is a member", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));

    const result = await getProject("user-1", "project-1");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(project);
  });

  it("rejects project updates from regular members", async () => {
    projectRepositoryMock.findById.mockResolvedValue(ok([project]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([{ ...ownerMembership, role: "member" }]));

    const result = await updateProject("user-1", "project-1", { name: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected result to be an error");
    expect(result.error.statusCode).toBe(403);
    expect(projectRepositoryMock.update).not.toHaveBeenCalled();
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
});
