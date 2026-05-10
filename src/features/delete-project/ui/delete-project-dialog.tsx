"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ProjectOutput } from "@/entities/project";
import { useDeleteProject } from "@/entities/project";
import { handleClientResult } from "@/shared/api/result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: Pick<ProjectOutput, "id" | "name">;
};

export function DeleteProjectDialog({ onOpenChange, open, project }: Props) {
  const router = useRouter();
  const deleteProject = useDeleteProject();
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === project.name && !deleteProject.isPending;

  const deleteSelectedProject = async () => {
    if (!canDelete) return;

    const result = await handleClientResult(() => deleteProject.mutateAsync(project.id), "Unable to delete project");
    result.match({
      ok: () => {
        toast.success("Project deleted");
        setConfirmation("");
        onOpenChange(false);
        router.push("/dashboard");
      },
      err: (error) => toast.error(error.message),
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setConfirmation("");
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes "{project.name}", including its boards, columns, tasks, and member access. Type the
            project name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="deleteProjectConfirmation">Project name</Label>
          <Input
            id="deleteProjectConfirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={project.name}
            disabled={deleteProject.isPending}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="min-w-32 shrink-0 whitespace-nowrap"
            onClick={deleteSelectedProject}
            disabled={!canDelete}
          >
            {deleteProject.isPending ? "Deleting..." : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
