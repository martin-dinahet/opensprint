"use client";

import { IconAlertCircle, IconFileText, IconLayoutKanban, IconLoader2, IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { useCreateBoardForm } from "../lib/use-create-board-form";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

export function CreateBoardDialog({ onOpenChange, open, projectId }: Props) {
  const { action, fieldErrors, globalError, pending, reset } = useCreateBoardForm({ onOpenChange, projectId });
  const nameError = fieldErrors?.name?.[0];
  const descriptionError = fieldErrors?.description?.[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Create board</DialogTitle>
            <DialogDescription>Add a kanban board inside this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="boardName">Name</Label>
              <div className="relative">
                <IconLayoutKanban className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="boardName"
                  name="name"
                  placeholder="Sprint board"
                  disabled={pending}
                  aria-invalid={!!nameError}
                  className={`pl-9 ${nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {nameError && (
                <p className="flex items-center gap-1.5 text-destructive text-sm">
                  <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {nameError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardDescription">Description</Label>
              <div className="relative">
                <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="boardDescription"
                  name="description"
                  placeholder="Release work, bugs, and follow-up tasks"
                  disabled={pending}
                  aria-invalid={!!descriptionError}
                  className={`min-h-24 pl-9 ${
                    descriptionError ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
              </div>
              {descriptionError && (
                <p className="flex items-center gap-1.5 text-destructive text-sm">
                  <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {descriptionError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create board
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
