"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { BoardOutput } from "@/features/board/types";
import type { MemberWithUserOutput } from "@/features/member/types";
import { TaskCard } from "@/features/task/components/task-card";
import type { TaskOutput } from "@/features/task/types";

type Props = {
  board: BoardOutput;
  tasks: TaskOutput[];
  onAddTask: () => void;
  onEditTask: (task: TaskOutput) => void;
  onDeleteTask: (id: string) => void;
  isHovered: boolean;
  members?: MemberWithUserOutput[];
};

export function KanbanBoard({ board, tasks, onAddTask, onEditTask, onDeleteTask, isHovered, members = [] }: Props) {
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
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} members={members} />
            ))}

            {tasks.length === 0 && (
              <div
                className={`flex h-20 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground text-xs transition-colors ${
                  isHighlighted ? "border-primary/40 bg-primary/5 text-primary/60" : "border-border/50"
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
