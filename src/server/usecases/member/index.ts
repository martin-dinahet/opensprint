import { nanoid } from "nanoid";
import { memberRepository } from "@/server/repositories";
import { NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from "../errors";
import type { AddMemberInput, UpdateMemberInput, MemberWithUserOutput } from "@/server/dto";

export class ListMembersUseCase {
  async execute(userId: string, projectId: string): Promise<MemberWithUserOutput[]> {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
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
  }
}

export class AddMemberUseCase {
  async execute(userId: string, projectId: string, input: AddMemberInput) {
    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(userId, projectId);

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (membership[0].role === "member") {
      throw new UnauthorizedError("Not authorized");
    }

    const { data: targetUser, error: userError } = await memberRepository.findUserByEmail(input.email);

    if (userError || !targetUser || targetUser.length === 0) {
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
  }
}

export class UpdateMemberUseCase {
  async execute(userId: string, projectId: string, memberId: string, input: UpdateMemberInput) {
    const { data: currentMembership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      projectId,
    );

    if (membershipError || !currentMembership || currentMembership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (currentMembership[0].role !== "owner") {
      throw new UnauthorizedError("Not authorized");
    }

    const { data: targetMember, error: targetError } = await memberRepository.findById(memberId);

    if (targetError || !targetMember || targetMember.length === 0) {
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
  }
}

export class RemoveMemberUseCase {
  async execute(userId: string, projectId: string, memberId: string) {
    const { data: currentMembership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      projectId,
    );

    if (membershipError || !currentMembership || currentMembership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (currentMembership[0].role === "member") {
      throw new UnauthorizedError("Not authorized");
    }

    const { data: targetMember, error: targetError } = await memberRepository.findById(memberId);

    if (targetError || !targetMember || targetMember.length === 0) {
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
  }
}

export const listMembersUseCase = new ListMembersUseCase();
export const addMemberUseCase = new AddMemberUseCase();
export const updateMemberUseCase = new UpdateMemberUseCase();
export const removeMemberUseCase = new RemoveMemberUseCase();
