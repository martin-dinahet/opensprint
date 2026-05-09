import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/server/features/shared/errors";
import { taskRepository } from "@/server/features/task/repositories";
import type { AddMemberInput, UpdateMemberInput } from "../dto";
import { memberRepository } from "../repositories";

export const listMembers = async (userId: string, projectId: string) => {
  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  const membersResult = await memberRepository.findByProject(projectId);

  if (membersResult.isErr()) {
    return err(new AppError("members-fetch-failed", `Unable to fetch members: ${membersResult.error.message}`, 500));
  }

  const allUsersResult = await memberRepository.findUsers();
  if (allUsersResult.isErr()) return err(allUsersResult.error);

  return ok(
    (membersResult.unwrap() || []).map((member) => {
      const userData = allUsersResult.unwrap()?.find((u) => u.id === member.userId);
      return {
        id: member.id,
        userId: member.userId,
        projectId: member.projectId,
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
  );
};

export const addMember = async (userId: string, projectId: string, input: AddMemberInput) => {
  const membershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (membership[0].role === "member") {
    return err(new UnauthorizedError("Not authorized"));
  }

  const targetUserResult = await memberRepository.findUserByEmail(input.email);
  if (targetUserResult.isErr()) return err(targetUserResult.error);

  const targetUser = targetUserResult.unwrap();
  if (!targetUser || targetUser.length === 0) {
    return err(new NotFoundError("User"));
  }

  const existingMemberResult = await memberRepository.findByUserAndProject(targetUser[0].id, projectId);
  if (existingMemberResult.isErr()) return err(existingMemberResult.error);

  if (existingMemberResult.unwrap() && existingMemberResult.unwrap().length > 0) {
    return err(new ConflictError("User is already a member"));
  }

  const memberId = nanoid();

  const addMemberResult = await memberRepository.create({
    id: memberId,
    projectId,
    userId: targetUser[0].id,
    role: input.role,
  });

  if (addMemberResult.isErr()) {
    return err(new AppError("member-add-failed", `Unable to add member: ${addMemberResult.error.message}`, 500));
  }

  return ok({
    id: memberId,
    userId: targetUser[0].id,
    projectId,
    role: input.role,
    joinedAt: new Date(),
  });
};

export const updateMember = async (userId: string, projectId: string, memberId: string, input: UpdateMemberInput) => {
  const currentMembershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (currentMembershipResult.isErr()) return err(currentMembershipResult.error);

  const currentMembership = currentMembershipResult.unwrap();
  if (!currentMembership || currentMembership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (currentMembership[0].role !== "owner") {
    return err(new UnauthorizedError("Not authorized"));
  }

  const targetMemberResult = await memberRepository.findById(memberId);
  if (targetMemberResult.isErr()) return err(targetMemberResult.error);

  const targetMember = targetMemberResult.unwrap();
  if (!targetMember || targetMember.length === 0) {
    return err(new NotFoundError("Member"));
  }

  if (targetMember[0].role === "owner") {
    return err(new ForbiddenError("Cannot change owner's role"));
  }

  const updateResult = await memberRepository.update(memberId, input);

  if (updateResult.isErr()) {
    return err(new AppError("member-update-failed", `Unable to update member: ${updateResult.error.message}`, 500));
  }

  return ok({
    id: targetMember[0].id,
    userId: targetMember[0].userId,
    projectId: targetMember[0].projectId,
    role: input.role,
    joinedAt: targetMember[0].joinedAt,
  });
};

export const removeMember = async (userId: string, projectId: string, memberId: string) => {
  const currentMembershipResult = await memberRepository.findByUserAndProject(userId, projectId);
  if (currentMembershipResult.isErr()) return err(currentMembershipResult.error);

  const currentMembership = currentMembershipResult.unwrap();
  if (!currentMembership || currentMembership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (currentMembership[0].role === "member") {
    return err(new UnauthorizedError("Not authorized"));
  }

  const targetMemberResult = await memberRepository.findById(memberId);
  if (targetMemberResult.isErr()) return err(targetMemberResult.error);

  const targetMember = targetMemberResult.unwrap();
  if (!targetMember || targetMember.length === 0) {
    return err(new NotFoundError("Member"));
  }

  if (targetMember[0].role === "owner") {
    return err(new ForbiddenError("Cannot remove owner"));
  }

  const clearAssigneeResult = await taskRepository.clearAssignee(memberId);

  if (clearAssigneeResult.isErr()) {
    return err(
      new AppError(
        "member-task-unassign-failed",
        `Unable to unassign member tasks: ${clearAssigneeResult.error.message}`,
        500,
      ),
    );
  }

  const deleteResult = await memberRepository.delete(memberId);

  if (deleteResult.isErr()) {
    return err(new AppError("member-remove-failed", `Unable to remove member: ${deleteResult.error.message}`, 500));
  }

  return ok({ success: true });
};
