export type { CreateInvitationInput } from "@/server/use-cases/invitation/dto";

import type { Invitation, Project, User } from "@/shared";

export type InvitationOutput = {
  id: Invitation["id"];
  projectId: Invitation["organizationId"];
  email: Invitation["email"];
  role: "admin" | "member";
  status: Invitation["status"];
  expiresAt: string;
  createdAt: string;
  inviter: Pick<User, "email" | "id" | "image"> & {
    name: User["name"] | null;
  };
  project?: Pick<Project, "id" | "name">;
};
