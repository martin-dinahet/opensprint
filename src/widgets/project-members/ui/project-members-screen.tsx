"use client";

import { MailPlusIcon, MoreHorizontalIcon, Trash2Icon, UserPlusIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import type { InvitationOutput } from "@/entities/invitation";
import type { MemberRole, MemberWithUserOutput } from "@/entities/member";
import { useProject } from "@/entities/project";
import { InviteMemberDialog, RemoveMemberDialog, useProjectMemberManagement } from "@/features/manage-project-members";
import { ProjectTabs } from "@/features/project-tabs";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LoadingScreen,
  NativeSelect,
  NativeSelectOption,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared";
import { UserAvatar } from "@/widgets/app-sidebar";
import { useDashboardHeader } from "@/widgets/header";

type ProjectMembersScreenProps = {
  projectId: string;
};

export function ProjectMembersScreen({ projectId }: ProjectMembersScreenProps) {
  const { data: project } = useProject(projectId);
  const memberManagement = useProjectMemberManagement(projectId);
  const {
    canChangeRoles,
    canManageMembers,
    cancelInvitationById,
    cancelInvitationPending,
    changeRole,
    createInvitationPending,
    fieldErrors,
    inviteMember,
    inviteOpen,
    invitations,
    invitationsLoading,
    members,
    membersLoading,
    pending,
    removeMemberPending,
    removeSelectedMember,
    removeTarget,
    session,
    setInviteOpen,
    setRemoveTarget,
    updateMemberPending,
  } = memberManagement;
  const header = useMemo(
    () => ({
      title: "Access table",
      description: "Manage roles, invitations, and removal risk for this project.",
      eyebrow: project?.name ?? "Project",
      actions: (
        <>
          <ProjectTabs activeTab="members" projectId={projectId} />
          {canManageMembers ? (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlusIcon />
              Invite member
            </Button>
          ) : null}
        </>
      ),
    }),
    [canManageMembers, project?.name, projectId, setInviteOpen],
  );

  useDashboardHeader(header);

  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {membersLoading ? (
            <LoadingScreen />
          ) : (
            <MembersTable
              canChangeRoles={canChangeRoles}
              canManageMembers={canManageMembers}
              members={members}
              onChangeRole={changeRole}
              onRemove={setRemoveTarget}
              sessionUserId={session.data?.user.id}
              updateMemberPending={updateMemberPending}
            />
          )}

          {canManageMembers ? (
            <InvitationsTable
              cancelInvitationPending={cancelInvitationPending}
              invitations={invitations}
              invitationsLoading={invitationsLoading}
              onCancel={cancelInvitationById}
            />
          ) : null}
        </div>
      </main>

      <InviteMemberDialog
        fieldErrors={fieldErrors}
        onOpenChange={setInviteOpen}
        onSubmit={inviteMember}
        open={inviteOpen}
        pending={pending || createInvitationPending}
      />
      <RemoveMemberDialog
        member={removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onRemove={removeSelectedMember}
        pending={removeMemberPending}
      />
    </>
  );
}

function MembersTable({
  canChangeRoles,
  canManageMembers,
  members,
  onChangeRole,
  onRemove,
  sessionUserId,
  updateMemberPending,
}: {
  canChangeRoles: boolean;
  canManageMembers: boolean;
  members: MemberWithUserOutput[];
  onChangeRole: (member: MemberWithUserOutput, role: "admin" | "member") => void;
  onRemove: (member: MemberWithUserOutput) => void;
  sessionUserId?: string;
  updateMemberPending: boolean;
}) {
  return (
    <div className="overflow-hidden border-2 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const canMutateMember = canManageMembers && !isOwner && member.userId !== sessionUserId;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={member.user} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.user.name || member.user.email}</p>
                      <p className="truncate text-muted-foreground text-xs">{member.user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canChangeRoles && !isOwner ? (
                    <NativeSelect
                      disabled={updateMemberPending}
                      onChange={(event) => onChangeRole(member, event.target.value as "admin" | "member")}
                      size="sm"
                      value={member.role}
                    >
                      <NativeSelectOption value="admin">Admin</NativeSelectOption>
                      <NativeSelectOption value="member">Member</NativeSelectOption>
                    </NativeSelect>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(member.joinedAt)}</TableCell>
                <TableCell>
                  {canMutateMember ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontalIcon />
                        <span className="sr-only">Member actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem variant="destructive" onClick={() => onRemove(member)}>
                          <Trash2Icon />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function InvitationsTable({
  cancelInvitationPending,
  invitations,
  invitationsLoading,
  onCancel,
}: {
  cancelInvitationPending: boolean;
  invitations: InvitationOutput[];
  invitationsLoading: boolean;
  onCancel: (invitation: InvitationOutput) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm">Pending invitations</h2>
          <p className="text-muted-foreground text-xs">Invites awaiting a response from existing users.</p>
        </div>
        <Badge variant="outline">{invitations.length}</Badge>
      </div>
      <div className="overflow-hidden border-2 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitationsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  Loading invitations...
                </TableCell>
              </TableRow>
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No pending invitations
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <MailPlusIcon className="shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{invitation.email}</p>
                        <p className="truncate text-muted-foreground text-xs">
                          Invited by {invitation.inviter.name || invitation.inviter.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={invitation.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invitation.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invitation.expiresAt)}</TableCell>
                  <TableCell>
                    <Button
                      disabled={cancelInvitationPending}
                      onClick={() => onCancel(invitation)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <XIcon />
                      <span className="sr-only">Cancel invitation</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function RoleBadge({ role }: { role: MemberRole }) {
  const variant = role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";
  return <Badge variant={variant}>{role}</Badge>;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
}
