import { IconDeviceFloppy, IconFileText, IconFlag, IconTextCaption } from "@tabler/icons-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskOutput } from "@/features/task/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  task: TaskOutput | null;
  onTaskChange: (task: TaskOutput | null) => void;
};

export function EditTaskDialog({ open, onOpenChange, onSave, task, onTaskChange }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onTaskChange(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details.</DialogDescription>
        </DialogHeader>
        {task && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTitle">Title</Label>
              <div className="relative">
                <IconTextCaption className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="editTitle"
                  value={task.title}
                  onChange={(e) => onTaskChange({ ...task, title: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <div className="relative">
                <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="editDescription"
                  value={task.description ?? ""}
                  onChange={(e) => onTaskChange({ ...task, description: e.target.value })}
                  className="min-h-24 pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPriority">Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => onTaskChange({ ...task, priority: v as TaskOutput["priority"] })}
              >
                <SelectTrigger className="w-full">
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
          </div>
        )}
        <DialogFooter>
          <Button onClick={onSave}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
