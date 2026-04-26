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
import type { TaskOutput } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  task: TaskOutput | null;
  onTaskChange: (task: TaskOutput | null) => void;
};

export function EditTaskDialog({ open, onOpenChange, onSave, task, onTaskChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onTaskChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details.</DialogDescription>
        </DialogHeader>
        {task && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={task.title}
                onChange={(e) => onTaskChange({ ...task, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPriority">Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => onTaskChange({ ...task, priority: v as TaskOutput["priority"] })}
              >
                <SelectTrigger>
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
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
