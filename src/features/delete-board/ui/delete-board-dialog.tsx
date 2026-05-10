"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BoardOutput } from "@/entities/board";
import { useDeleteBoard } from "@/entities/board";
import { handleClientResult } from "@/shared/api/result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

type Props = {
  board: Pick<BoardOutput, "id" | "name" | "projectId">;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  redirectToProject?: boolean;
};

export function DeleteBoardDialog({ board, onDeleted, onOpenChange, open, redirectToProject = false }: Props) {
  const router = useRouter();
  const deleteBoard = useDeleteBoard();

  const deleteSelectedBoard = async () => {
    const result = await handleClientResult(
      () => deleteBoard.mutateAsync({ projectId: board.projectId, boardId: board.id }),
      "Unable to delete board",
    );
    result.match({
      ok: () => {
        toast.success("Board deleted");
        onOpenChange(false);
        onDeleted?.();
        if (redirectToProject) router.push(`/projects/${board.projectId}`);
      },
      err: (error) => toast.error(error.message),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete board?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes "{board.name}" and all of its columns and tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={deleteSelectedBoard} disabled={deleteBoard.isPending}>
            {deleteBoard.isPending ? "Deleting..." : "Delete board"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
