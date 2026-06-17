"use client";

import { Loader2Icon, UserPlusIcon } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
} from "@/shared";

type InviteMemberDialogProps = {
  fieldErrors: Record<string, string[]> | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  open: boolean;
  pending: boolean;
};

export function InviteMemberDialog({ fieldErrors, onOpenChange, onSubmit, open, pending }: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>Send an invitation to an existing OpenSprint user.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!fieldErrors?.email}>
              <FieldLabel htmlFor="memberEmail">Email</FieldLabel>
              <Input id="memberEmail" name="email" type="email" placeholder="teammate@example.com..." />
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
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <UserPlusIcon />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
