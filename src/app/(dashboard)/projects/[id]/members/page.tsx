"use client";

import { Loader2Icon, MoreHorizontalIcon, PlusIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { use, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  type MemberRole,
  type MemberWithUserOutput,
  useAddMember,
  useMembers,
  useRemoveMember,
  useUpdateMember,
} from "@/entities/member";
import { ProjectTabs } from "@/features/project-tabs";
import { handleClientResult } from "@/shared";
import { authClient } from "@/shared";
import { parseFormData } from "@/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared";
import { Badge } from "@/shared";
import { Button } from "@/shared";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared";
import { Input } from "@/shared";
import { LoadingScreen } from "@/shared";
import { NativeSelect, NativeSelectOption } from "@/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared";
import { UserAvatar } from "@/widgets/app-sidebar";
import { useDashboardHeader } from "@/widgets/header";

const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

type Props = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: Props) {
  const { id: projectId } = use(params);
  const session = authClient.useSession();
  const { data: members = [], isLoading } = useMembers(projectId);
  const addMember = useAddMember(projectId);
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberWithUserOutput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startTransition] = useTransition();
  const currentMember = members.find((member) => member.userId === session.data?.user.id);
  const canManageMembers = currentMember?.role === "owner" || currentMember?.role === "admin";
  const canChangeRoles = currentMember?.role === "owner";
  const header = useMemo(
    () => ({
      actions: <ProjectTabs activeTab="members" projectId={projectId} />,
    }),
    [projectId],
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

      const result = await handleClientResult(() => addMember.mutateAsync(parsed.data), "Unable to add member");
      result.match({
        ok: () => {
          toast.success("Member added");
          setAddOpen(false);
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

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Manage the people who can see this project, move tasks, and administer access.
            </p>
            {canManageMembers ? (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlusIcon />
                Add member
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <LoadingScreen />
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
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
        </div>
      </main>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) setFieldErrors(null);
          setAddOpen(open);
        }}
      >
        <DialogContent>
          <form action={inviteMember}>
            <DialogHeader>
              <DialogTitle>Add member</DialogTitle>
              <DialogDescription>Add an existing OpenSprint user to this project.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field data-invalid={!!fieldErrors?.email}>
                <FieldLabel htmlFor="memberEmail">Email</FieldLabel>
                <Input id="memberEmail" name="email" type="email" placeholder="teammate@example.com" />
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
              <Button type="submit" disabled={pending || addMember.isPending}>
                {pending || addMember.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                Add member
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
              {removeMember.isPending ? "Removing..." : "Remove"}
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
