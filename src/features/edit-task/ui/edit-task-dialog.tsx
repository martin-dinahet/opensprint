import { IconAlertCircle, IconDeviceFloppy } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import { TaskFormFields } from "@/features/task-form";
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
import { useEditTaskForm } from "../model/use-edit-task-form";

type Props = {
  members: MemberWithUserOutput[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  task: TaskOutput | null;
};

export const EditTaskDialog = ({ members, onOpenChange, open, task }: Props) => {
  const {
    action,
    assigneeId,
    description,
    fieldErrors,
    globalError,
    pending,
    priority,
    reset,
    setAssigneeId,
    setDescription,
    setPriority,
    setTitle,
    title,
  } = useEditTaskForm({ onOpenChange, task });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[min(820px,calc(100svh-2rem))] overflow-hidden sm:max-w-2xl">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the task details. Descriptions support Markdown.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100svh-12rem)] overflow-y-auto pr-1">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <TaskFormFields
              assigneeId={assigneeId}
              description={description}
              disabled={pending}
              errors={fieldErrors}
              members={members}
              priority={priority}
              setAssigneeId={setAssigneeId}
              setDescription={setDescription}
              setPriority={setPriority}
              setTitle={setTitle}
              title={title}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !task}>
              {pending ? (
                <IconDeviceFloppy className="mr-2 h-4 w-4 animate-pulse" />
              ) : (
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
              )}
              Save task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
