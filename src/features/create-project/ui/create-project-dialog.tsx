"use client";

import { IconAlertCircle, IconFileText, IconFolder, IconLoader2, IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/shared/shadcn/alert";
import { Button } from "@/shared/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/shadcn/dialog";
import { Input } from "@/shared/shadcn/input";
import { Label } from "@/shared/shadcn/label";
import { Textarea } from "@/shared/shadcn/textarea";
import { useCreateProjectForm } from "../model/use-create-project-form";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CreateProjectDialog({ onOpenChange, open }: Props) {
  const { action, fieldErrors, globalError, pending, reset } = useCreateProjectForm({ onOpenChange });
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
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>Add a workspace for columns, tasks, and collaborators.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="projectName">Name</Label>
              <div className="relative">
                <IconFolder className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="projectName"
                  name="name"
                  placeholder="Mobile app launch"
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
              <Label htmlFor="projectDescription">Description</Label>
              <div className="relative">
                <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="projectDescription"
                  name="description"
                  placeholder="Roadmap, design, and release work"
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
                  Create project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
