import { and, eq, gt } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { invitation, organization, user } from "@/server/db/schema";
import type { InvitationStatus, NewInvitation } from "@/shared";

type InvitationUpdate = Partial<Pick<NewInvitation, "status">>;

export class InvitationRepository {
  async create(data: Pick<NewInvitation, "email" | "expiresAt" | "id" | "inviterId" | "organizationId" | "role">) {
    return handle(() =>
      db.insert(invitation).values({
        id: data.id,
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        status: "pending",
        inviterId: data.inviterId,
        expiresAt: data.expiresAt,
      }),
    );
  }

  async findById(id: string) {
    return handle(() => db.select().from(invitation).where(eq(invitation.id, id)));
  }

  async findPendingByProject(projectId: string) {
    return handle(() =>
      db
        .select({ invitation, inviter: user })
        .from(invitation)
        .innerJoin(user, eq(invitation.inviterId, user.id))
        .where(and(eq(invitation.organizationId, projectId), eq(invitation.status, "pending"))),
    );
  }

  async findPendingByProjectAndEmail(projectId: string, email: string) {
    return handle(() =>
      db
        .select()
        .from(invitation)
        .where(
          and(eq(invitation.organizationId, projectId), eq(invitation.email, email), eq(invitation.status, "pending")),
        ),
    );
  }

  async findPendingForEmail(email: string, now: Date) {
    return handle(() =>
      db
        .select({ invitation, project: organization, inviter: user })
        .from(invitation)
        .innerJoin(organization, eq(invitation.organizationId, organization.id))
        .innerJoin(user, eq(invitation.inviterId, user.id))
        .where(and(eq(invitation.email, email), eq(invitation.status, "pending"), gt(invitation.expiresAt, now))),
    );
  }

  async updateStatus(id: string, status: InvitationStatus) {
    return this.update(id, { status });
  }

  async update(id: string, data: InvitationUpdate) {
    return handle(() => db.update(invitation).set(data).where(eq(invitation.id, id)));
  }
}

export const invitationRepository = new InvitationRepository();
