import { IconAlertCircle, IconHash, IconLayoutColumns, IconLoader2, IconPlus } from "@tabler/icons-react";
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
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared";
import { useCreateColumnForm } from "../model/use-create-column-form";

type Props = {
  boardId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

const columnKindItems = {
  active: "Active",
  backlog: "Backlog",
  custom: "Custom",
  done: "Done",
  review: "Review",
};

export function CreateColumnDialog({ boardId, onOpenChange, open, projectId }: Props) {
  const { action, fieldErrors, globalError, pending, reset } = useCreateColumnForm({
    boardId,
    onOpenChange,
    projectId,
  });
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
            <DialogDescription>Create a new workflow column in this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {globalError && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="columnName">Column name</Label>
              <div className="relative">
                <IconLayoutColumns className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="columnName"
                  name="name"
                  placeholder="In progress…"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="columnKind">Workflow kind</Label>
                <Select items={columnKindItems} defaultValue="custom" name="kind">
                  <SelectTrigger id="columnKind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="columnWipLimit">WIP limit</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <IconHash />
                  </InputGroupAddon>
                  <InputGroupInput id="columnWipLimit" name="wipLimit" type="number" min={1} placeholder="None" />
                </InputGroup>
              </div>
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
                  Creating…
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
