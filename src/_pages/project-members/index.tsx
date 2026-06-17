"use client";

import { Loader2Icon, MailPlusIcon, MoreHorizontalIcon, Trash2Icon, UserPlusIcon, XIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
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
import { useProject } from "@/entities/project";
import { ProjectTabs } from "@/features/project-tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  authClient,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  handleClientResult,
  Input,
  LoadingScreen,
  NativeSelect,
  NativeSelectOption,
  parseFormData,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared";
import { UserAvatar } from "@/widgets/app-sidebar";
import { useDashboardHeader } from "@/widgets/header";

const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

type ProjectMembersPageProps = {
  projectId: string;
};

export function ProjectMembersPage({ projectId }: ProjectMembersPageProps) {
  const session = authClient.useSession();
  const { data: members = [], isLoading } = useMembers(projectId);
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const { data: project } = useProject(projectId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberWithUserOutput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startTransition] = useTransition();
  const currentMember = members.find((member) => member.userId === session.data?.user.id);
  const canManageMembers = currentMember?.role === "owner" || currentMember?.role === "admin";
  const canChangeRoles = currentMember?.role === "owner";
  const createInvitation = useCreateInvitation(projectId);
  const cancelInvitation = useCancelInvitation(projectId);
  const { data: invitations = [], isLoading: invitationsLoading } = useProjectInvitations(projectId, canManageMembers);
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
    [canManageMembers, project?.name, projectId],
  );

  useDashboardHeader(header);

  const inviteMember = (formData: FormData) => {
    startTransition(async () => {
      setFieldErrors(null);
      const parsed = parseFormData(addMemberSchema, formData);
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

  const changeRole = async (member: MemberWithUserOutput, role: "admin" | "member") => {
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

  const cancelSelectedInvitation = async (invitation: InvitationOutput) => {
    const result = await handleClientResult(
      () => cancelInvitation.mutateAsync(invitation.id),
      "Unable to cancel invitation",
    );
    result.match({
      ok: () => toast.success("Invitation canceled"),
      err: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {isLoading ? (
            <LoadingScreen />
          ) : (
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
                    const canMutateMember = canManageMembers && !isOwner && member.userId !== session.data?.user.id;
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
                              size="sm"
                              value={member.role}
                              onChange={(event) => changeRole(member, event.target.value as "admin" | "member")}
                              disabled={updateMember.isPending}
                            >
                              <NativeSelectOption value="admin">Admin</NativeSelectOption>
                              <NativeSelectOption value="member">Member</NativeSelectOption>
                            </NativeSelect>
                          ) : (
                            <RoleBadge role={member.role} />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                            new Date(member.joinedAt),
                          )}
                        </TableCell>
                        <TableCell>
                          {canMutateMember && (
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                                <MoreHorizontalIcon />
                                <span className="sr-only">Member actions</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem variant="destructive" onClick={() => setRemoveTarget(member)}>
                                  <Trash2Icon />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {canManageMembers ? (
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
                          Loading invitations…
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
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => cancelSelectedInvitation(invitation)}
                              disabled={cancelInvitation.isPending}
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
          ) : null}
        </div>
      </main>

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!open) setFieldErrors(null);
          setInviteOpen(open);
        }}
      >
        <DialogContent>
          <form action={inviteMember}>
            <DialogHeader>
              <DialogTitle>Invite member</DialogTitle>
              <DialogDescription>Send an invitation to an existing OpenSprint user.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field data-invalid={!!fieldErrors?.email}>
                <FieldLabel htmlFor="memberEmail">Email</FieldLabel>
                <Input id="memberEmail" name="email" type="email" placeholder="teammate@example.com…" />
                <FieldError>{fieldErrors?.email?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors?.role}>
                <FieldLabel htmlFor="memberRole">Role</FieldLabel>
                <NativeSelect id="memberRole" name="role" defaultValue="member" className="w-full">
                  <NativeSelectOption value="member">Member</NativeSelectOption>
                  <NativeSelectOption value="admin">Admin</NativeSelectOption>
                </NativeSelect>
                <FieldError>{fieldErrors?.role?.[0]}</FieldError>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={pending || createInvitation.isPending}>
                {pending || createInvitation.isPending ? <Loader2Icon className="animate-spin" /> : <UserPlusIcon />}
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.user.email} will lose access to this project and its tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={removeSelectedMember} disabled={removeMember.isPending}>
              {removeMember.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RoleBadge({ role }: { role: MemberRole }) {
  const variant = role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";
  return <Badge variant={variant}>{role}</Badge>;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
}
