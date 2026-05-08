import { IconFileText, IconFlag, IconLoader2, IconPlus, IconTextCaption } from "@tabler/icons-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  isPending: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  priority: "low" | "medium" | "high" | "urgent";
  onPriorityChange: (priority: "low" | "medium" | "high" | "urgent") => void;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreate,
  isPending,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  priority,
  onPriorityChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a new task in this column.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="taskTitle">Title</Label>
            <div className="relative">
              <IconTextCaption className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="taskTitle"
                placeholder="Draft sprint plan"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreate()}
                disabled={isPending}
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taskDesc">Description</Label>
            <div className="relative">
              <IconFileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="taskDesc"
                placeholder="Optional notes, links, or acceptance criteria"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                disabled={isPending}
                className="min-h-24 pl-9"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taskPriority">Priority</Label>
            <Select value={priority} onValueChange={(v) => onPriorityChange(v as typeof priority)}>
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
        <DialogFooter>
          <Button onClick={onCreate} disabled={isPending || !title.trim()}>
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
