import { IconAlertCircle, IconLoader2, IconPlus } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
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
import { useCreateTaskForm } from "../model/use-create-task-form";

type Props = {
  columnId: string;
  members: MemberWithUserOutput[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export const CreateTaskDialog = ({ columnId, members, onOpenChange, open }: Props) => {
  const { action, assigneeId, fieldErrors, globalError, pending, priority, reset, setAssigneeId, setPriority } =
    useCreateTaskForm({ columnId, onOpenChange });

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
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>Create a new task in this column. Descriptions support Markdown.</DialogDescription>
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
              disabled={pending}
              errors={fieldErrors}
              members={members}
              priority={priority}
              setAssigneeId={setAssigneeId}
              setPriority={setPriority}
            />
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
                  Add task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
