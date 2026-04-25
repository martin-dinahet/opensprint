import { and, eq } from "drizzle-orm";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { projectMember, user } from "@/server/db/schema";
import type { UpdateMemberInput } from "../dto";

export class MemberRepository {
  async findByUserAndProject(userId: string, projectId: string) {
    return handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.userId, userId), eq(projectMember.projectId, projectId))),
    );
  }

  async findByProject(projectId: string) {
    return handle(db.select().from(projectMember).where(eq(projectMember.projectId, projectId)));
  }

  async findById(id: string) {
    return handle(db.select().from(projectMember).where(eq(projectMember.id, id)));
  }

  async findByUserId(userId: string) {
    return handle(db.select().from(projectMember).where(eq(projectMember.userId, userId)));
  }

  async create(data: { id: string; projectId: string; userId: string; role: "owner" | "admin" | "member" }) {
    return handle(
      db.insert(projectMember).values({
        id: data.id,
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
      }),
    );
  }

  async update(id: string, data: UpdateMemberInput) {
    return handle(db.update(projectMember).set(data).where(eq(projectMember.id, id)));
  }

  async delete(id: string) {
    return handle(db.delete(projectMember).where(eq(projectMember.id, id)));
  }

  async deleteByProject(projectId: string) {
    return handle(db.delete(projectMember).where(eq(projectMember.projectId, projectId)));
  }

  async findUserByEmail(email: string) {
    return handle(db.select().from(user).where(eq(user.email, email)));
  }

  async findUsers() {
    return handle(db.select().from(user));
  }
}

export const memberRepository = new MemberRepository();
