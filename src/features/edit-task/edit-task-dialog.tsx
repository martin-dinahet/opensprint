import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconFileText,
  IconFlag,
  IconTextCaption,
  IconUser,
} from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput, TaskPriority } from "@/entities/task";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useEditTaskForm } from "./use-edit-task-form";

const priorityItems = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
};

const getMemberLabel = (member: MemberWithUserOutput) => member.user.name || member.user.email;

type Props = {
  members: MemberWithUserOutput[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  task: TaskOutput | null;
};

export function EditTaskDialog({ members, onOpenChange, open, task }: Props) {
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
  const titleError = fieldErrors?.title?.[0];
  const descriptionError = fieldErrors?.description?.[0];
  const assigneeItems = [
    { label: "Unassigned", value: null },
    ...members.map((member) => ({ label: getMemberLabel(member), value: member.id })),
  ];

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
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="editTitle">Title</Label>
              <div className="relative">
                <IconTextCaption className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="editTitle"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={pending}
                  aria-invalid={!!titleError}
                  className={`pl-9 ${titleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {titleError && (
                <p className="flex items-center gap-1.5 text-destructive text-sm">
                  <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {titleError}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <div className="relative">
                <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="editDescription"
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
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
            <div className="grid gap-2">
              <Label htmlFor="editPriority">Priority</Label>
              <input name="priority" type="hidden" value={priority} />
              <Select
                items={priorityItems}
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="editPriority" className="w-full">
                  <IconFlag className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editAssignee">Assignee</Label>
              <input name="assigneeId" type="hidden" value={assigneeId ?? ""} />
              <Select
                items={assigneeItems}
                value={assigneeId}
                onValueChange={(value) => setAssigneeId(typeof value === "string" ? value : null)}
              >
                <SelectTrigger id="editAssignee" className="w-full">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {getMemberLabel(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !task}>
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
