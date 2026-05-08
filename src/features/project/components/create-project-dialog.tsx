"use client";

import { IconAlertCircle, IconFileText, IconFolder, IconLoader2, IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  description: string;
  error?: string | null;
  isPending: boolean;
  name: string;
  onCreate: () => void;
  onDescriptionChange: (description: string) => void;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CreateProjectDialog({
  description,
  error,
  isPending,
  name,
  onCreate,
  onDescriptionChange,
  onNameChange,
  onOpenChange,
  open,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Add a workspace for boards, tasks, and collaborators.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="projectName">Name</Label>
            <div className="relative">
              <IconFolder className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="projectName"
                placeholder="Mobile app launch"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && onCreate()}
                disabled={isPending}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description</Label>
            <div className="relative">
              <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="projectDescription"
                placeholder="Roadmap, design, and release work"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                disabled={isPending}
                className="min-h-24 pl-9"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCreate} disabled={isPending || !name.trim()}>
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <IconPlus className="mr-2 h-4 w-4" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
