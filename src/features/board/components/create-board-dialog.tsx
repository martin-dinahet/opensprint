import { IconLayoutColumns, IconLoader2, IconPlus } from "@tabler/icons-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  isPending: boolean;
  name: string;
  onNameChange: (name: string) => void;
};

export function CreateBoardDialog({ open, onOpenChange, onCreate, isPending, name, onNameChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
          <DialogDescription>Create a new column in this board.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="boardName">Column Name</Label>
            <div className="relative">
              <IconLayoutColumns className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="boardName"
                placeholder="In progress"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreate()}
                disabled={isPending}
                className="pl-9"
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
