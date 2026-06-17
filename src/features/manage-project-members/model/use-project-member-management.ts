"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  type InvitationOutput,
  useCancelInvitation,
  useCreateInvitation,
  useProjectInvitations,
} from "@/entities/invitation";
import {
  type MemberRole,
  type MemberWithUserOutput,
  useMembers,
  useRemoveMember,
  useUpdateMember,
} from "@/entities/member";
import { authClient, handleClientResult, parseFormData } from "@/shared";

const inviteMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

export function useProjectMemberManagement(projectId: string) {
  const session = authClient.useSession();
  const { data: members = [], isLoading: membersLoading } = useMembers(projectId);
  const currentMember = members.find((member) => member.userId === session.data?.user.id);
  const canManageMembers = currentMember?.role === "owner" || currentMember?.role === "admin";
  const canChangeRoles = currentMember?.role === "owner";
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const createInvitation = useCreateInvitation(projectId);
  const cancelInvitation = useCancelInvitation(projectId);
  const { data: invitations = [], isLoading: invitationsLoading } = useProjectInvitations(projectId, canManageMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberWithUserOutput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startTransition] = useTransition();

  const closeInviteDialog = (open: boolean) => {
    if (!open) setFieldErrors(null);
    setInviteOpen(open);
  };

  const inviteMember = (formData: FormData) => {
    startTransition(async () => {
      setFieldErrors(null);
      const parsed = parseFormData(inviteMemberSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      const result = await handleClientResult(
        () => createInvitation.mutateAsync(parsed.data),
        "Unable to send invitation",
      );
      result.match({
        ok: () => {
          toast.success("Invitation sent");
          setInviteOpen(false);
        },
        err: (error) => toast.error(error.message),
      });
    });
  };

  const changeRole = async (member: MemberWithUserOutput, role: Exclude<MemberRole, "owner">) => {
    const result = await handleClientResult(
      () => updateMember.mutateAsync({ memberId: member.id, data: { role } }),
      "Unable to update role",
    );
    result.match({
      ok: () => toast.success("Role updated"),
      err: (error) => toast.error(error.message),
    });
  };

  const removeSelectedMember = async () => {
    if (!removeTarget) return;

    const result = await handleClientResult(() => removeMember.mutateAsync(removeTarget.id), "Unable to remove member");
    result.match({
      ok: () => {
        toast.success("Member removed");
        setRemoveTarget(null);
      },
      err: (error) => toast.error(error.message),
    });
  };

  const cancelInvitationById = async (invitation: InvitationOutput) => {
    const result = await handleClientResult(
      () => cancelInvitation.mutateAsync(invitation.id),
      "Unable to cancel invitation",
    );
    result.match({
      ok: () => toast.success("Invitation canceled"),
      err: (error) => toast.error(error.message),
    });
  };

  return {
    canChangeRoles,
    canManageMembers,
    cancelInvitationById,
    cancelInvitationPending: cancelInvitation.isPending,
    changeRole,
    createInvitationPending: createInvitation.isPending,
    fieldErrors,
    inviteMember,
    inviteOpen,
    invitations,
    invitationsLoading,
    members,
    membersLoading,
    pending,
    removeMemberPending: removeMember.isPending,
    removeSelectedMember,
    removeTarget,
    session,
    setInviteOpen: closeInviteDialog,
    setRemoveTarget,
    updateMemberPending: updateMember.isPending,
  };
}
