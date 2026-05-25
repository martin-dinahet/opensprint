"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconDotsVertical, IconEdit, IconGauge, IconPlus, IconTrash } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import type { TaskOutput } from "@/entities/task";
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
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared";
import { useProjectKanban } from "../lib";
import { ColumnSettingsDialog } from "./column-settings-dialog";
import { ConfirmableTaskCard } from "./confirmable-task-card";
import type { ColumnProps, ColumnSettingsInput, KanbanColumnViewProps, TaskCardProps } from "./kanban-types";

export const KanbanColumn = ({ column, isHovered, tasks }: ColumnProps) => {
  const { openCreateTask, removeColumn, updateColumnSettings } = useProjectKanban();

  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={() => openCreateTask(column.id)}
      onDeleteColumn={() => removeColumn(column.id)}
      onUpdateColumn={(input) => updateColumnSettings(column.id, input)}
      tasks={tasks}
    />
  );
};

export const ColumnView = ({
  column,
  children,
  isHovered,
  onAddTask,
  onDeleteColumn,
  onUpdateColumn,
  tasks,
}: ColumnProps & {
  children?: ReactNode;
  onAddTask: () => void;
  onDeleteColumn: () => void;
  onUpdateColumn?: (input: ColumnSettingsInput) => Promise<unknown> | unknown;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const isHighlighted = isOver || isHovered;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const wipExceeded = !!column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div
      className={`group/column flex h-full w-88 shrink-0 flex-col border-2 bg-card transition-colors duration-150 ${
        isHighlighted ? "bg-accent/35 ring-2 ring-ring" : ""
      }`}
    >
      <div className="shrink-0 border-b-2 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex min-w-0 flex-col gap-1 text-sm" aria-label={column.name}>
            <span className="truncate font-black uppercase">{column.name}</span>
            <span className="flex items-center gap-2 text-muted-foreground text-[0.68rem] uppercase">
              <span>{column.kind}</span>
              <span className={wipExceeded ? "font-semibold text-destructive" : ""}>
                {tasks.length}
                {column.wipLimit ? `/${column.wipLimit}` : ""} tasks
              </span>
            </span>
          </h3>
          {column.wipLimit ? (
            <span
              className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[0.68rem] ${wipExceeded ? "bg-destructive text-white" : "bg-background"}`}
            >
              <IconGauge className="h-3 w-3" />
              WIP
            </span>
          ) : null}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-focus-within/column:opacity-100 group-hover/column:opacity-100">
          <Button variant="default" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <IconPlus className="h-3 w-3" />
            <span className="sr-only">Add task</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
              <IconDotsVertical className="h-3 w-3" />
              <span className="sr-only">Column actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <IconEdit />
                Edit column
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <IconTrash />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-[120px] flex-1 overflow-y-auto bg-muted/25 p-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {children ?? tasks.map((task) => <KanbanTaskCard key={task.id} columnId={column.id} task={task} />)}

            {tasks.length === 0 && (
              <div
                className={`flex min-h-20 items-center justify-center border border-dashed px-3 text-center text-muted-foreground text-xs transition-colors ${
                  isHighlighted ? "bg-accent/40 text-foreground" : "border-border/70"
                }`}
              >
                <Button variant="ghost" size="sm" onClick={onAddTask}>
                  <IconPlus className="h-3.5 w-3.5" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
      {onUpdateColumn ? (
        <ColumnSettingsDialog
          column={column}
          onOpenChange={setSettingsOpen}
          onSave={onUpdateColumn}
          open={settingsOpen}
        />
      ) : null}
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

export const KanbanTaskCard = ({ columnId, task }: TaskCardProps) => {
  const { members, openTask, removeTask } = useProjectKanban();

  return (
    <ConfirmableTaskCard
      members={members}
      onDelete={() => removeTask(columnId, task.id)}
      onOpen={openTask}
      task={task}
    />
  );
};

export const KanbanColumnView = ({
  column,
  isHovered,
  members = [],
  onAddTask,
  onDeleteColumn,
  onDeleteTask,
  onOpenTask,
  onUpdateColumn,
  tasks,
}: KanbanColumnViewProps) => {
  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={onAddTask}
      onDeleteColumn={() => onDeleteColumn(column.id)}
      onUpdateColumn={onUpdateColumn}
      tasks={tasks}
    >
      {tasks.map((task: TaskOutput) => (
        <ConfirmableTaskCard
          key={task.id}
          members={members}
          onDelete={() => onDeleteTask(task.id)}
          onOpen={onOpenTask}
          task={task}
        />
      ))}
    </ColumnView>
  );
};
