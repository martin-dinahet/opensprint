import type { Invitation, Project, User } from "@/shared";

export function toInvitationOutput({
  invitation,
  inviter,
  project,
}: {
  invitation: Invitation;
  inviter: User;
  project?: Pick<Project, "id" | "name">;
}) {
  return {
    id: invitation.id,
    projectId: invitation.organizationId,
    email: invitation.email,
    role: invitation.role as "admin" | "member",
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    inviter: {
      id: inviter.id,
      name: inviter.name,
      email: inviter.email,
      image: inviter.image,
    },
    ...(project
      ? {
          project: {
            id: project.id,
            name: project.name,
          },
        }
      : {}),
  };
}
