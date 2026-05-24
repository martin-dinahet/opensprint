import { and, count, eq, inArray } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { member, user } from "@/server/db/schema";
import type { MemberUpdate, NewMember } from "@/shared";

export class MemberRepository {
  async findByUserAndProject(userId: string, projectId: string) {
    return handle(() =>
      db
        .select()
        .from(member)
        .where(and(eq(member.userId, userId), eq(member.organizationId, projectId))),
    );
  }

  async findByProject(projectId: string) {
    return handle(() => db.select().from(member).where(eq(member.organizationId, projectId)));
  }

  async findById(id: string) {
    return handle(() => db.select().from(member).where(eq(member.id, id)));
  }

  async findByUserId(userId: string) {
    return handle(() => db.select().from(member).where(eq(member.userId, userId)));
  }

  async countByProjectIds(projectIds: string[]) {
    if (projectIds.length === 0) {
      return handle(() => Promise.resolve([]));
    }

    return handle(() =>
      db
        .select({ projectId: member.organizationId, count: count() })
        .from(member)
        .where(inArray(member.organizationId, projectIds))
        .groupBy(member.organizationId),
    );
  }

  async create(data: Pick<NewMember, "id" | "organizationId" | "role" | "userId">) {
    return handle(() =>
      db.insert(member).values({
        id: data.id,
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
      }),
    );
  }

  async update(id: string, data: MemberUpdate) {
    return handle(() => db.update(member).set(data).where(eq(member.id, id)));
  }

  async delete(id: string) {
    return handle(() => db.delete(member).where(eq(member.id, id)));
  }

  async deleteByProject(projectId: string) {
    return handle(() => db.delete(member).where(eq(member.organizationId, projectId)));
  }

  async findUserByEmail(email: string) {
    return handle(() => db.select().from(user).where(eq(user.email, email)));
  }

  async findUsers() {
    return handle(() => db.select().from(user));
  }

  async findByProjectWithUsers(projectId: string) {
    return handle(() =>
      db
        .select({ member, user })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, projectId)),
    );
  }
}

export const memberRepository = new MemberRepository();
