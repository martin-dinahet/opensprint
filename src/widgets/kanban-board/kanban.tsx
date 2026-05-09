"use client";

import { DndContext, DragOverlay, MeasuringStrategy, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import type { BoardOutput } from "@/entities/board";
import { kanbanCollisionDetection } from "@/entities/board/lib/kanban-dnd";
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
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { useProjectKanban } from "./project-kanban-context";

type RootProps = {
  children: ReactNode;
};

type ColumnsProps = {
  children: ReactNode;
};

type ColumnProps = {
  board: BoardOutput;
  isHovered: boolean;
  tasks: TaskOutput[];
};

type TaskCardProps = {
  boardId: string;
  task: TaskOutput;
};

type KanbanBoardProps = ColumnProps & {
  members?: Parameters<typeof EntityTaskCard>[0]["members"];
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: TaskOutput) => void;
};

function Root({ children }: RootProps) {
  const { kanbanDrag } = useProjectKanban();

  return (
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
  );
}

function Columns({ children }: ColumnsProps) {
  return <div className="flex h-full gap-3 p-4">{children}</div>;
}

function Column({ board, isHovered, tasks }: ColumnProps) {
  const { openCreateTask } = useProjectKanban();
  return <ColumnView board={board} isHovered={isHovered} onAddTask={() => openCreateTask(board.id)} tasks={tasks} />;
}

function ColumnView({
  board,
  children,
  isHovered,
  onAddTask,
  tasks,
}: ColumnProps & { children?: ReactNode; onAddTask: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: board.id,
    data: { type: "board", board },
  });

  const isHighlighted = isOver || isHovered;

  return (
    <div
      className={`flex h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors duration-150 ${
        isHighlighted ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <h3 className="truncate font-semibold text-sm">{board.name}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="tabular-nums">{tasks.length}</span>
          <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={onAddTask}>
            <IconPlus className="h-3 w-3" />
            <span className="sr-only">Add task</span>
          </Button>
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-[120px] flex-1 overflow-y-auto p-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {children ?? tasks.map((task) => <TaskCard key={task.id} boardId={board.id} task={task} />)}

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
    </div>
  );
}

function TaskCard({ boardId, task }: TaskCardProps) {
  const { members, openEditTask, removeTask } = useProjectKanban();

  return (
    <ConfirmableTaskCard
      members={members}
      onDelete={() => removeTask(boardId, task.id)}
      onEdit={openEditTask}
      task={task}
    />
  );
}

function ConfirmableTaskCard({
  members,
  onDelete,
  onEdit,
  task,
}: {
  members: Parameters<typeof EntityTaskCard>[0]["members"];
  onDelete: () => void;
  onEdit: (task: TaskOutput) => void;
  task: TaskOutput;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <EntityTaskCard task={task} onEdit={onEdit} onDelete={() => setDeleteOpen(true)} members={members} />
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
}

export function KanbanBoard({
  board,
  isHovered,
  members = [],
  onAddTask,
  onDeleteTask,
  onEditTask,
  tasks,
}: KanbanBoardProps) {
  return (
    <ColumnView board={board} isHovered={isHovered} onAddTask={onAddTask} tasks={tasks}>
      {tasks.map((task) => (
        <ConfirmableTaskCard
          key={task.id}
          members={members}
          onDelete={() => onDeleteTask(task.id)}
          onEdit={onEditTask}
          task={task}
        />
      ))}
    </ColumnView>
  );
}

function Overlay() {
  const { kanbanDrag, members } = useProjectKanban();

  return (
    <DragOverlay
      dropAnimation={
        kanbanDrag.isCrossBoardDrop
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
          onEdit={() => {}}
          task={kanbanDrag.activeTask}
        />
      ) : null}
    </DragOverlay>
  );
}

export const Kanban = {
  Column,
  Columns,
  Overlay,
  Root,
  TaskCard,
};
