"use client";

import { IconTrash } from "@tabler/icons-react";
import type { TaskOutput } from "@/entities/task";
import { TaskCard as EntityTaskCard } from "@/entities/task";
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
} from "@/shared";
import { useState } from "react";

type Props = {
  members: Parameters<typeof EntityTaskCard>[0]["members"];
  onDelete: () => void;
  onOpen: (task: TaskOutput) => void;
  task: TaskOutput;
};

export const ConfirmableTaskCard = ({ members, onDelete, onOpen, task }: Props) => {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <EntityTaskCard task={task} onOpen={onOpen} onDelete={() => setDeleteOpen(true)} members={members} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{task.title}" from the column.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDelete();
                setDeleteOpen(false);
              }}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
