import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { invitationRepositoryMock, memberRepositoryMock, nanoidMock } = vi.hoisted(() => ({
  invitationRepositoryMock: {
    create: vi.fn(),
    findById: vi.fn(),
    findPendingByProject: vi.fn(),
    findPendingByProjectAndEmail: vi.fn(),
    findPendingForEmail: vi.fn(),
    updateStatus: vi.fn(),
  },
  memberRepositoryMock: {
    create: vi.fn(),
    findByUserAndProject: vi.fn(),
    findUserByEmail: vi.fn(),
  },
  nanoidMock: vi.fn(),
}));

vi.mock("nanoid", () => ({
  nanoid: nanoidMock,
}));

vi.mock("@/server/repositories", () => ({
  invitationRepository: invitationRepositoryMock,
  memberRepository: memberRepositoryMock,
}));

const {
  AcceptInvitationUseCase,
  CancelInvitationUseCase,
  CreateInvitationUseCase,
  DeclineInvitationUseCase,
  ListProjectInvitationsUseCase,
  ListUserInvitationsUseCase,
} = await import("@/server/use-cases/invitation");

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
const inviter = { id: "owner-user", name: "Owner", email: "owner@example.com", image: null };
const invitee = { id: "invitee-user", name: "Invitee", email: "invitee@example.com", image: null };
const pendingInvitation = {
  id: "invitation-1",
  organizationId: "project-1",
  email: "invitee@example.com",
  role: "member",
  status: "pending",
  inviterId: "owner-user",
  expiresAt: new Date("2027-01-08T00:00:00.000Z"),
  createdAt,
};

describe("invitation use cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nanoidMock.mockReturnValue("generated-id");
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([ownerMembership]));
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([invitee]));
    invitationRepositoryMock.findPendingByProjectAndEmail.mockResolvedValue(ok([]));
    invitationRepositoryMock.create.mockResolvedValue(ok(undefined));
    invitationRepositoryMock.updateStatus.mockResolvedValue(ok(undefined));
  });

  it("creates pending invitations for owners and admins", async () => {
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));

    const result = await CreateInvitationUseCase.execute("owner-user", "project-1", {
      email: "Invitee@Example.com",
      role: "member",
    });

    expect(result.isOk()).toBe(true);
    expect(invitationRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-id",
        organizationId: "project-1",
        email: "invitee@example.com",
        role: "member",
        inviterId: "owner-user",
      }),
    );
  });

  it("rejects invitation creation from regular members", async () => {
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([regularMembership]));

    const result = await CreateInvitationUseCase.execute("regular-user", "project-1", {
      email: "invitee@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(403);
    expect(memberRepositoryMock.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns not found for unknown invite emails", async () => {
    memberRepositoryMock.findUserByEmail.mockResolvedValue(ok([]));

    const result = await CreateInvitationUseCase.execute("owner-user", "project-1", {
      email: "missing@example.com",
      role: "admin",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(404);
    expect(invitationRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("rejects inviting existing members and duplicate pending invites", async () => {
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([regularMembership]));

    const existingMemberResult = await CreateInvitationUseCase.execute("owner-user", "project-1", {
      email: "invitee@example.com",
      role: "member",
    });

    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));
    invitationRepositoryMock.findPendingByProjectAndEmail.mockResolvedValue(ok([pendingInvitation]));

    const duplicateResult = await CreateInvitationUseCase.execute("owner-user", "project-1", {
      email: "invitee@example.com",
      role: "member",
    });

    expect(existingMemberResult.isErr()).toBe(true);
    expect(duplicateResult.isErr()).toBe(true);
    if (existingMemberResult.isErr()) expect(existingMemberResult.error.statusCode).toBe(409);
    if (duplicateResult.isErr()) expect(duplicateResult.error.statusCode).toBe(409);
  });

  it("lists current user pending invitations by normalized email", async () => {
    invitationRepositoryMock.findPendingForEmail.mockResolvedValue(
      ok([{ invitation: pendingInvitation, project: { id: "project-1", name: "Launch" }, inviter }]),
    );

    const result = await ListUserInvitationsUseCase.execute("Invitee@Example.com");

    expect(result.isOk()).toBe(true);
    expect(invitationRepositoryMock.findPendingForEmail).toHaveBeenCalledWith("invitee@example.com", expect.any(Date));
    expect(result.unwrap()[0]).toMatchObject({
      id: "invitation-1",
      project: { id: "project-1", name: "Launch" },
    });
  });

  it("lists and cancels project pending invitations for managers", async () => {
    invitationRepositoryMock.findPendingByProject.mockResolvedValue(ok([{ invitation: pendingInvitation, inviter }]));
    invitationRepositoryMock.findById.mockResolvedValue(ok([pendingInvitation]));

    const listResult = await ListProjectInvitationsUseCase.execute("owner-user", "project-1");
    const cancelResult = await CancelInvitationUseCase.execute("owner-user", "project-1", "invitation-1");

    expect(listResult.isOk()).toBe(true);
    expect(cancelResult.unwrap()).toEqual({ success: true });
    expect(invitationRepositoryMock.updateStatus).toHaveBeenCalledWith("invitation-1", "canceled");
  });

  it("accepts pending invitations and creates membership", async () => {
    invitationRepositoryMock.findById.mockResolvedValue(ok([pendingInvitation]));
    memberRepositoryMock.findByUserAndProject.mockResolvedValue(ok([]));
    memberRepositoryMock.create.mockResolvedValue(ok(undefined));

    const result = await AcceptInvitationUseCase.execute("invitee-user", "invitee@example.com", "invitation-1");

    expect(result.isOk()).toBe(true);
    expect(memberRepositoryMock.create).toHaveBeenCalledWith({
      id: "generated-id",
      organizationId: "project-1",
      userId: "invitee-user",
      role: "member",
    });
    expect(invitationRepositoryMock.updateStatus).toHaveBeenCalledWith("invitation-1", "accepted");
  });

  it("declines pending invitations without creating membership", async () => {
    invitationRepositoryMock.findById.mockResolvedValue(ok([pendingInvitation]));

    const result = await DeclineInvitationUseCase.execute("invitee-user", "invitee@example.com", "invitation-1");

    expect(result.unwrap()).toEqual({ success: true });
    expect(memberRepositoryMock.create).not.toHaveBeenCalled();
    expect(invitationRepositoryMock.updateStatus).toHaveBeenCalledWith("invitation-1", "declined");
  });

  it("marks expired invitations and rejects acceptance", async () => {
    invitationRepositoryMock.findById.mockResolvedValue(
      ok([{ ...pendingInvitation, expiresAt: new Date("2020-01-01T00:00:00.000Z") }]),
    );

    const result = await AcceptInvitationUseCase.execute("invitee-user", "invitee@example.com", "invitation-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.statusCode).toBe(409);
    expect(invitationRepositoryMock.updateStatus).toHaveBeenCalledWith("invitation-1", "expired");
    expect(memberRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("wraps invitation creation failures", async () => {
    memberRepositoryMock.findByUserAndProject
      .mockResolvedValueOnce(ok([ownerMembership]))
      .mockResolvedValueOnce(ok([]));
    invitationRepositoryMock.create.mockResolvedValue(err(new Error("insert failed")));

    const result = await CreateInvitationUseCase.execute("owner-user", "project-1", {
      email: "invitee@example.com",
      role: "member",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.statusCode).toBe(500);
      expect(result.error.message).toContain("insert failed");
    }
  });
});
