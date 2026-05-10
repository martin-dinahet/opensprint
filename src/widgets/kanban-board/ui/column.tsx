"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconDotsVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
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
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { useProjectKanban } from "../lib/project-kanban-context";
import { TaskCard } from "./task-card";
import type { ColumnProps } from "./types";

type ColumnViewProps = ColumnProps & {
  children?: ReactNode;
  onAddTask: () => void;
  onDeleteColumn: () => void;
};

export const Column = ({ column, isHovered, tasks }: ColumnProps) => {
  const { openCreateTask, removeColumn } = useProjectKanban();

  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={() => openCreateTask(column.id)}
      onDeleteColumn={() => removeColumn(column.id)}
      tasks={tasks}
    />
  );
};

export const ColumnView = ({ children, column, isHovered, onAddTask, onDeleteColumn, tasks }: ColumnViewProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const isHighlighted = isOver || isHovered;
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className={`flex h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors duration-150 ${
        isHighlighted ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <h3 className="truncate font-semibold text-sm">{column.name}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="tabular-nums">{tasks.length}</span>
          <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={onAddTask}>
            <IconPlus className="h-3 w-3" />
            <span className="sr-only">Add task</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
              <IconDotsVertical className="h-3 w-3" />
              <span className="sr-only">Column actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <IconTrash />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-[120px] flex-1 overflow-y-auto p-2">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {children ?? tasks.map((task) => <TaskCard key={task.id} columnId={column.id} task={task} />)}

            {tasks.length === 0 && (
              <div
                className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 text-center text-muted-foreground text-xs transition-colors ${
                  isHighlighted ? "border-primary/40 bg-primary/5 text-primary/60" : "border-border/50"
                }`}
              >
                <span>Drop tasks here</span>
                <Button variant="ghost" size="sm" onClick={onAddTask}>
                  <IconPlus className="h-3.5 w-3.5" />
                  Add first task
                </Button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{column.name}" and {tasks.length} contained task
              {tasks.length === 1 ? "" : "s"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDeleteColumn();
                setDeleteOpen(false);
              }}
            >
              Delete column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
