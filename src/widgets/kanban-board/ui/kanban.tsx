"use client";

import { DndContext, DragOverlay, MeasuringStrategy, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconDotsVertical, IconEdit, IconGauge, IconPlus, IconTrash } from "@tabler/icons-react";
import { type ReactNode, useState, useTransition } from "react";
import type { ColumnOutput } from "@/entities/column";
import type { TaskOutput } from "@/entities/task";
import { TaskCard as EntityTaskCard, TaskCardContent } from "@/entities/task";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/shared";
import { kanbanCollisionDetection, useProjectKanban } from "../lib";

type RootProps = {
  children: ReactNode;
};

type ColumnsProps = {
  children: ReactNode;
};

type ColumnProps = {
  column: ColumnOutput;
  isHovered: boolean;
  tasks: TaskOutput[];
};

type TaskCardProps = {
  columnId: string;
  task: TaskOutput;
};

type KanbanColumnViewProps = ColumnProps & {
  members?: Parameters<typeof EntityTaskCard>[0]["members"];
  onAddTask: () => void;
  onDeleteColumn: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenTask: (task: TaskOutput) => void;
  onRenameColumn?: (name: string) => Promise<unknown> | unknown;
};

const Root = ({ children }: RootProps) => {
  const { kanbanDrag } = useProjectKanban();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        collisionDetection={kanbanCollisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragCancel={kanbanDrag.handleDragCancel}
        onDragEnd={kanbanDrag.handleDragEnd}
        onDragOver={kanbanDrag.handleDragOver}
        onDragStart={kanbanDrag.handleDragStart}
        sensors={kanbanDrag.sensors}
      >
        {children}
        <Overlay />
      </DndContext>
    </div>
  );
};

const Columns = ({ children }: ColumnsProps) => {
  return <div className="flex flex-1 gap-3 p-3">{children}</div>;
};

const Column = ({ column, isHovered, tasks }: ColumnProps) => {
  const { openCreateTask, removeColumn, renameColumn } = useProjectKanban();

  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={() => openCreateTask(column.id)}
      onDeleteColumn={() => removeColumn(column.id)}
      onRenameColumn={(name) => renameColumn(column.id, name)}
      tasks={tasks}
    />
  );
};

const ColumnView = ({
  column,
  children,
  isHovered,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  tasks,
}: ColumnProps & {
  children?: ReactNode;
  onAddTask: () => void;
  onDeleteColumn: () => void;
  onRenameColumn?: (name: string) => Promise<unknown> | unknown;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const isHighlighted = isOver || isHovered;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
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
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <IconEdit />
                Rename column
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
            {children ?? tasks.map((task) => <TaskCard key={task.id} columnId={column.id} task={task} />)}

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
      {onRenameColumn ? (
        <RenameColumnDialog column={column} onRename={onRenameColumn} open={renameOpen} onOpenChange={setRenameOpen} />
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

function RenameColumnDialog({
  column,
  onOpenChange,
  onRename,
  open,
}: {
  column: ColumnOutput;
  onOpenChange: (open: boolean) => void;
  onRename: (name: string) => Promise<unknown> | unknown;
  open: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const action = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const name = String(formData.get("name") ?? "").trim();

      if (!name) {
        setError("Column name is required");
        return;
      }

      try {
        await onRename(name);
        onOpenChange(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to rename column");
      }
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setError(null);
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <form action={action}>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename column</AlertDialogTitle>
            <AlertDialogDescription>Update the column name shown on this board.</AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor={`column-name-${column.id}`}>Name</FieldLabel>
              <Input
                id={`column-name-${column.id}`}
                name="name"
                defaultValue={column.name}
                disabled={pending}
                autoFocus
              />
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={pending}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const TaskCard = ({ columnId, task }: TaskCardProps) => {
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

const ConfirmableTaskCard = ({
  members,
  onDelete,
  onOpen,
  task,
}: {
  members: Parameters<typeof EntityTaskCard>[0]["members"];
  onDelete: () => void;
  onOpen: (task: TaskOutput) => void;
  task: TaskOutput;
}) => {
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

export const KanbanColumnView = ({
  column,
  isHovered,
  members = [],
  onAddTask,
  onDeleteColumn,
  onDeleteTask,
  onOpenTask,
  onRenameColumn,
  tasks,
}: KanbanColumnViewProps) => {
  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={onAddTask}
      onDeleteColumn={() => onDeleteColumn(column.id)}
      onRenameColumn={onRenameColumn}
      tasks={tasks}
    >
      {tasks.map((task) => (
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

const Overlay = () => {
  const { kanbanDrag, members } = useProjectKanban();

  return (
    <DragOverlay
      dropAnimation={
        kanbanDrag.isCrossColumnDrop
          ? null
          : {
              duration: 180,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            }
      }
    >
      {kanbanDrag.activeTask ? (
        <TaskCardContent
          isOverlay
          members={members}
          onDelete={() => {}}
          onOpen={() => {}}
          task={kanbanDrag.activeTask}
        />
      ) : null}
    </DragOverlay>
  );
};

export const Kanban = {
  Column,
  Columns,
  Overlay,
  Root,
  TaskCard,
};
