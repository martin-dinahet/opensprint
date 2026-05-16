import { and, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { member, user } from "@/server/db/schema";
import type { MemberUpdate, NewMember } from "@/shared/types";

export class MemberRepository {
  async findByUserAndProject(userId: string, projectId: string) {
    return handle(() =>
      db
        .select()
        .from(member)
        .where(and(eq(member.userId, userId), eq(member.projectId, projectId))),
    );
  }

  async findByProject(projectId: string) {
    return handle(() => db.select().from(member).where(eq(member.projectId, projectId)));
  }

  async findById(id: string) {
    return handle(() => db.select().from(member).where(eq(member.id, id)));
  }

  async findByUserId(userId: string) {
    return handle(() => db.select().from(member).where(eq(member.userId, userId)));
  }

  async create(data: Pick<NewMember, "id" | "projectId" | "role" | "userId">) {
    return handle(() =>
      db.insert(member).values({
        id: data.id,
        projectId: data.projectId,
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
    return handle(() => db.delete(member).where(eq(member.projectId, projectId)));
  }

  async findUserByEmail(email: string) {
    return handle(() => db.select().from(user).where(eq(user.email, email)));
  }

  async findUsers() {
    return handle(() => db.select().from(user));
  }
}

export const memberRepository = new MemberRepository();
