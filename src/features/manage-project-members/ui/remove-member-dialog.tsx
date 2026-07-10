"use client";

import type { MemberWithUserOutput } from "@/entities/member";
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

type RemoveMemberDialogProps = {
  member: MemberWithUserOutput | null;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  pending: boolean;
};

export function RemoveMemberDialog({ member, onOpenChange, onRemove, pending }: RemoveMemberDialogProps) {
  return (
    <AlertDialog open={!!member} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member?</AlertDialogTitle>
          <AlertDialogDescription>
            {member?.user.email} will lose access to this project and its tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onRemove} disabled={pending}>
            {pending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
