import { nanoid } from "nanoid";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/features/shared/errors";
import type { AddMemberInput, UpdateMemberInput } from "../dto";
import { memberRepository } from "../repositories";

export const listMembers = async (userId: string, projectId: string) => {
  const { data: membership } = await memberRepository.findByUserAndProject(userId, projectId);

  if (!membership || membership.length === 0) {
    throw new UnauthorizedError("Not a member of this project");
  }

  const { data: members, error: membersError } = await memberRepository.findByProject(projectId);

  if (membersError) {
    throw new Error(`Unable to fetch members: ${membersError}`);
  }

  const { data: allUsers } = await memberRepository.findUsers();

  return (members || []).map((member) => {
    const userData = allUsers?.find((u) => u.id === member.userId);
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
  });
};

export const addMember = async (userId: string, projectId: string, input: AddMemberInput) => {
  const { data: membership } = await memberRepository.findByUserAndProject(userId, projectId);

  if (!membership || membership.length === 0) {
    throw new UnauthorizedError("Not authorized");
  }

  if (membership[0].role === "member") {
    throw new UnauthorizedError("Not authorized");
  }

  const { data: targetUser } = await memberRepository.findUserByEmail(input.email);

  if (!targetUser || targetUser.length === 0) {
    throw new NotFoundError("User");
  }

  const { data: existingMember } = await memberRepository.findByUserAndProject(targetUser[0].id, projectId);

  if (existingMember && existingMember.length > 0) {
    throw new ConflictError("User is already a member");
  }

  const memberId = nanoid();

  const { error: addMemberError } = await memberRepository.create({
    id: memberId,
    projectId,
    userId: targetUser[0].id,
    role: input.role,
  });

  if (addMemberError) {
    throw new Error(`Unable to add member: ${addMemberError}`);
  }

  return {
    id: memberId,
    userId: targetUser[0].id,
    projectId,
    role: input.role,
    joinedAt: new Date(),
  };
};

export const updateMember = async (userId: string, projectId: string, memberId: string, input: UpdateMemberInput) => {
  const { data: currentMembership } = await memberRepository.findByUserAndProject(userId, projectId);

  if (!currentMembership || currentMembership.length === 0) {
    throw new UnauthorizedError("Not authorized");
  }

  if (currentMembership[0].role !== "owner") {
    throw new UnauthorizedError("Not authorized");
  }

  const { data: targetMember } = await memberRepository.findById(memberId);

  if (!targetMember || targetMember.length === 0) {
    throw new NotFoundError("Member");
  }

  if (targetMember[0].role === "owner") {
    throw new ForbiddenError("Cannot change owner's role");
  }

  const { error: updateError } = await memberRepository.update(memberId, input);

  if (updateError) {
    throw new Error(`Unable to update member: ${updateError}`);
  }

  return {
    id: targetMember[0].id,
    userId: targetMember[0].userId,
    projectId: targetMember[0].projectId,
    role: input.role,
    joinedAt: targetMember[0].joinedAt,
  };
};

export const removeMember = async (userId: string, projectId: string, memberId: string) => {
  const { data: currentMembership } = await memberRepository.findByUserAndProject(userId, projectId);

  if (!currentMembership || currentMembership.length === 0) {
    throw new UnauthorizedError("Not authorized");
  }

  if (currentMembership[0].role === "member") {
    throw new UnauthorizedError("Not authorized");
  }

  const { data: targetMember } = await memberRepository.findById(memberId);

  if (!targetMember || targetMember.length === 0) {
    throw new NotFoundError("Member");
  }

  if (targetMember[0].role === "owner") {
    throw new ForbiddenError("Cannot remove owner");
  }

  const { error: deleteError } = await memberRepository.delete(memberId);

  if (deleteError) {
    throw new Error(`Unable to remove member: ${deleteError}`);
  }

  return { success: true };
};
