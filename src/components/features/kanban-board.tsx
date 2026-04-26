"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { BoardOutput, TaskOutput } from "@/lib/types";
import { TaskCard } from "./task-card";

type Props = {
  board: BoardOutput;
  tasks: TaskOutput[];
  onAddTask: () => void;
  onEditTask: (task: TaskOutput) => void;
  onDeleteTask: (id: string) => void;
  isHovered: boolean;
};

export function KanbanBoard({ board, tasks, onAddTask, onEditTask, onDeleteTask, isHovered }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: board.id,
    data: { type: "board", board },
  });

  const isHighlighted = isOver || isHovered;

  return (
    <div
      className={`flex h-full w-72 flex-col shrink-0 rounded-lg border bg-muted/40 transition-all duration-200 ${
        isHighlighted ? "ring-2 ring-primary/50 bg-primary/5 border-primary/30 scale-[1.02]" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
        <h3 className="font-semibold text-sm">{board.name}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="tabular-nums">{tasks.length}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={onAddTask}>
            <IconPlus className="h-3 w-3" />
            <span className="sr-only">Add task</span>
          </Button>
        </span>
      </div>

      {/*
        The droppable ref is on the scroll container so the entire column
        body is a valid drop target — including the empty space below tasks.
      */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 min-h-[120px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}

            {/* Empty-state drop target so columns with no tasks are still droppable */}
            {tasks.length === 0 && (
              <div
                className={`h-20 rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground transition-colors ${
                  isHighlighted ? "border-primary/40 text-primary/60 bg-primary/5" : "border-border/50"
                }`}
              >
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
