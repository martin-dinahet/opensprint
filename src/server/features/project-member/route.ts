import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import z from "zod";
import { handle } from "@/lib/handle";
import { db } from "@/server/db";
import { project, projectMember, user } from "@/server/db/schema";
import { guard } from "@/server/lib/guard";
import type { ServerVariables } from "@/server/lib/types";
import { validate } from "@/server/lib/validate";

const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

const UpdateMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
});

/**
 * GET /api/projects/:id/members
 * Lists all members of a project.
 *
 * Expects:
 *   - Auth: Required (via cookie)
 *   - Params: id (project ID)
 *
 * Returns:
 *   200: { members: Array<{ id, userId, role, joinedAt, user: { id, name, email, image } }> }
 *   401: { success: false, errors: { root: "Not authenticated" } }
 *   403: { success: false, errors: { root: "Not a member of this project" } }
 *   404: { success: false, errors: { root: "Project not found" } }
 */
export const projectMemberRoute = new Hono<ServerVariables>() //
  .get("/:id/members", guard(), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");

    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not a member of this project" } }, 403);
    }

    const { data: members, error: membersError } = await handle(
      db.select().from(projectMember).where(eq(projectMember.projectId, projectId)),
    );
    if (membersError) {
      console.error(`unable to fetch members: ${membersError}`);
      return c.json({ success: false, errors: { root: "Unable to fetch members" } }, 500);
    }
    if (!members || members.length === 0) {
      return c.json({ members: [] });
    }

    const { data: allUsers } = await handle(db.select().from(user));

    return c.json({
      members: members.map((member) => {
        const userData = allUsers?.find((u) => u.id === member.userId);
        return {
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            id: userData?.id,
            name: userData?.name,
            email: userData?.email,
            image: userData?.image,
          },
        };
      }),
    });
  })

  /**
   * POST /api/projects/:id/members
   * Adds a user to a project.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID)
   *   - Body: { email: string, role: "admin" | "member" }
   *
   * Returns:
   *   200: { id, userId, projectId, role, joinedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not authorized" } }
   *   404: { success: false, errors: { root: "Project not found" } }
   */
  .post("/:id/members", guard(), validate("json", AddMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const currentUser = c.get("user");
    const { email, role } = c.req.valid("json");

    const { data: foundProject, error: projectError } = await handle(
      db.select().from(project).where(eq(project.id, projectId)),
    );
    if (projectError || !foundProject || foundProject.length === 0) {
      console.error(`unable to find project: ${projectError}`);
      return c.json({ success: false, errors: { root: "Project not found" } }, 404);
    }

    const { data: membership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !membership || membership.length === 0) {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }
    if (membership[0].role === "member") {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }

    const { data: targetUser, error: userError } = await handle(db.select().from(user).where(eq(user.email, email)));
    if (userError || !targetUser || targetUser.length === 0) {
      return c.json({ success: false, errors: { root: "User not found" } }, 404);
    }

    const { data: existingMember } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, targetUser[0].id))),
    );
    if (existingMember && existingMember.length > 0) {
      return c.json({ success: false, errors: { root: "User is already a member" } }, 400);
    }

    const memberId = nanoid();
    const { error: addMemberError } = await handle(
      db.insert(projectMember).values({
        id: memberId,
        projectId,
        userId: targetUser[0].id,
        role,
      }),
    );
    if (addMemberError) {
      console.error(`unable to add member: ${addMemberError}`);
      return c.json({ success: false, errors: { root: "Unable to add member" } }, 500);
    }

    return c.json({
      id: memberId,
      userId: targetUser[0].id,
      projectId,
      role,
      joinedAt: new Date().toISOString(),
    });
  })

  /**
   * PATCH /api/projects/:id/members/:memberId
   * Updates a member's role.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID), memberId (member ID)
   *   - Body: { role: "admin" | "member" }
   *
   * Returns:
   *   200: { id, userId, projectId, role, joinedAt }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not authorized" } }
   *   404: { success: false, errors: { root: "Member not found" } }
   */
  .patch("/:id/members/:memberId", guard(), validate("json", UpdateMemberSchema), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");
    const { role } = c.req.valid("json");

    const { data: currentMembership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !currentMembership || currentMembership.length === 0) {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }
    if (currentMembership[0].role !== "owner") {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }

    const { data: targetMember, error: targetError } = await handle(
      db.select().from(projectMember).where(eq(projectMember.id, memberId)),
    );
    if (targetError || !targetMember || targetMember.length === 0) {
      return c.json({ success: false, errors: { root: "Member not found" } }, 404);
    }

    if (targetMember[0].role === "owner") {
      return c.json({ success: false, errors: { root: "Cannot change owner's role" } }, 403);
    }

    const { error: updateError } = await handle(
      db.update(projectMember).set({ role }).where(eq(projectMember.id, memberId)),
    );
    if (updateError) {
      console.error(`unable to update member: ${updateError}`);
      return c.json({ success: false, errors: { root: "Unable to update member" } }, 500);
    }

    return c.json({
      id: targetMember[0].id,
      userId: targetMember[0].userId,
      projectId: targetMember[0].projectId,
      role,
      joinedAt: targetMember[0].joinedAt,
    });
  })

  /**
   * DELETE /api/projects/:id/members/:memberId
   * Removes a member from a project.
   *
   * Expects:
   *   - Auth: Required (via cookie)
   *   - Params: id (project ID), memberId (member ID)
   *
   * Returns:
   *   200: { success: boolean }
   *   401: { success: false, errors: { root: "Not authenticated" } }
   *   403: { success: false, errors: { root: "Not authorized" } }
   *   404: { success: false, errors: { root: "Member not found" } }
   */
  .delete("/:id/members/:memberId", guard(), async (c) => {
    const projectId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const currentUser = c.get("user");

    const { data: currentMembership, error: membershipError } = await handle(
      db
        .select()
        .from(projectMember)
        .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id))),
    );
    if (membershipError || !currentMembership || currentMembership.length === 0) {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }
    if (currentMembership[0].role === "member") {
      return c.json({ success: false, errors: { root: "Not authorized" } }, 403);
    }

    const { data: targetMember, error: targetError } = await handle(
      db.select().from(projectMember).where(eq(projectMember.id, memberId)),
    );
    if (targetError || !targetMember || targetMember.length === 0) {
      return c.json({ success: false, errors: { root: "Member not found" } }, 404);
    }

    if (targetMember[0].role === "owner") {
      return c.json({ success: false, errors: { root: "Cannot remove owner" } }, 403);
    }

    const { error: deleteError } = await handle(db.delete(projectMember).where(eq(projectMember.id, memberId)));
    if (deleteError) {
      console.error(`unable to delete member: ${deleteError}`);
      return c.json({ success: false, errors: { root: "Unable to remove member" } }, 500);
    }

    return c.json({ success: true });
  });
