"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAddProjectMember } from "@/entities/member";
import { handleClientResult } from "@/shared/api/result";
import { parseFormData } from "@/shared/lib/forms";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { useAppSidebar } from "../lib/app-sidebar-context";

const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ProjectInviteDialog({ onOpenChange, open }: Props) {
  const { activeProject, currentProjectRole, projectId } = useAppSidebar();
  const addMember = useAddProjectMember(projectId);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startTransition] = useTransition();
  const canManageMembers = currentProjectRole === "owner" || currentProjectRole === "admin";

  const inviteMember = (formData: FormData) => {
    if (!canManageMembers) return;

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
          onOpenChange(false);
        },
        err: (error) => toast.error(error.message),
      });
    });
  };

  return (
    <Dialog
      open={open && !!projectId && canManageMembers}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setFieldErrors(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <form action={inviteMember}>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Add an existing OpenSprint user to {activeProject?.name ?? "this project"}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!fieldErrors?.email}>
              <FieldLabel htmlFor="sidebarMemberEmail">Email</FieldLabel>
              <Input id="sidebarMemberEmail" name="email" type="email" placeholder="teammate@example.com" />
              <FieldError>{fieldErrors?.email?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!fieldErrors?.role}>
              <FieldLabel htmlFor="sidebarMemberRole">Role</FieldLabel>
              <NativeSelect id="sidebarMemberRole" name="role" defaultValue="member" className="w-full">
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
  );
}
