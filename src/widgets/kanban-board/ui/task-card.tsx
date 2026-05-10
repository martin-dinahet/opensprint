"use client";

import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
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
} from "@/shared/ui/alert-dialog";
import { useProjectKanban } from "../lib/project-kanban-context";
import type { ConfirmableTaskCardProps, TaskCardProps } from "./types";

export const TaskCard = ({ columnId, task }: TaskCardProps) => {
  const { members, openEditTask, openViewTask, removeTask } = useProjectKanban();

  return (
    <ConfirmableTaskCard
      members={members}
      onDelete={() => removeTask(columnId, task.id)}
      onEdit={openEditTask}
      onView={openViewTask}
      task={task}
    />
  );
};

export const ConfirmableTaskCard = ({ members, onDelete, onEdit, onView, task }: ConfirmableTaskCardProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <EntityTaskCard
        task={task}
        onEdit={onEdit}
        onView={onView}
        onDelete={() => setDeleteOpen(true)}
        members={members}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove "{task.title}" from the board.</AlertDialogDescription>
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
