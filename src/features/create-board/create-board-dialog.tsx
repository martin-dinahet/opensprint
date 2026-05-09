import { IconAlertCircle, IconLayoutColumns, IconLoader2, IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useCreateBoardForm } from "./use-create-board-form";

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

export function CreateBoardDialog({ onOpenChange, open, projectId }: Props) {
  const { action, fieldErrors, globalError, pending, reset } = useCreateBoardForm({ onOpenChange, projectId });
  const nameError = fieldErrors?.name?.[0];

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
            <DialogTitle>Add column</DialogTitle>
            <DialogDescription>Create a new column in this board.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="boardName">Column name</Label>
              <div className="relative">
                <IconLayoutColumns className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="boardName"
                  name="name"
                  placeholder="In progress"
                  disabled={pending}
                  aria-invalid={!!nameError}
                  className={`pl-9 ${nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {nameError && (
                <p className="flex items-center gap-1.5 text-destructive text-sm">
                  <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {nameError}
                </p>
              )}
            </div>
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
                  Add column
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
