import { IconAlertCircle, IconDeviceFloppy } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import { TaskFormFields } from "@/features/task-form";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared";
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
    estimate,
    fieldErrors,
    globalError,
    kind,
    pending,
    priority,
    reset,
    setAssigneeId,
    setDescription,
    setEstimate,
    setKind,
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
            <DialogDescription>Update the task details.</DialogDescription>
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
              estimate={estimate}
              kind={kind}
              members={members}
              priority={priority}
              setAssigneeId={setAssigneeId}
              setDescription={setDescription}
              setEstimate={setEstimate}
              setKind={setKind}
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
