import { IconCheck, IconPlus } from "@tabler/icons-react";
import { Button, SheetFooter } from "@/shared";

type Props = {
  isCreateMode: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  title: string;
};

export function TaskSheetFooter({ isCreateMode, onOpenChange, pending, title }: Props) {
  return (
    <SheetFooter className="border-t bg-popover">
      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {isCreateMode ? "Cancel" : "Close"}
        </Button>
        <Button type="submit" disabled={pending || title.trim().length === 0}>
          {isCreateMode ? <IconPlus className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
          {isCreateMode ? "Create task" : "Save changes"}
        </Button>
      </div>
    </SheetFooter>
  );
}
