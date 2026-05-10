"use client";

import { IconAlertCircle, IconFileText, IconFolder, IconLoader2, IconPencil } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import type { ProjectOutput } from "@/entities/project";
import { useUpdateProject } from "@/entities/project";
import { handleClientResult } from "@/shared/api/result";
import { parseFormData } from "@/shared/lib/forms";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

const editProjectSchema = z.object({
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(3).max(800).optional(),
  ),
  name: z.string().trim().min(3).max(130),
});

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: Pick<ProjectOutput, "description" | "id" | "name">;
};

export function EditProjectDialog({ onOpenChange, open, project }: Props) {
  const updateProject = useUpdateProject();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const isPending = pending || updateProject.isPending;
  const nameError = fieldErrors?.name?.[0];
  const descriptionError = fieldErrors?.description?.[0];

  const reset = () => {
    setFieldErrors(null);
    setGlobalError(null);
  };

  const action = (formData: FormData) => {
    startTransition(async () => {
      reset();

      const { data, fieldErrors } = parseFormData(editProjectSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }

      const result = await handleClientResult(
        () => updateProject.mutateAsync({ id: project.id, data }),
        "Unable to update project",
      );
      result.match({
        ok: () => {
          toast.success("Project updated");
          onOpenChange(false);
        },
        err: (error) => setGlobalError(error.message),
      });
    });
  };

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
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update the project name and the context people see before opening boards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="editProjectName">Name</Label>
              <div className="relative">
                <IconFolder className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="editProjectName"
                  name="name"
                  defaultValue={project.name}
                  disabled={isPending}
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
              <Label htmlFor="editProjectDescription">Description</Label>
              <div className="relative">
                <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="editProjectDescription"
                  name="description"
                  defaultValue={project.description ?? ""}
                  disabled={isPending}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconPencil className="mr-2 h-4 w-4" />
                  Save project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
