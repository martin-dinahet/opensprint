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
  showPlaceholderForBoard: string | null;
  isHovered: boolean;
};

export function BoardColumn({
  board,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  showPlaceholderForBoard,
  isHovered,
}: Props) {
  return (
    <div
      className={`flex h-full w-72 flex-col shrink-0 rounded-lg border bg-card transition-colors ${
        isHovered ? "ring-2 ring-primary/50" : ""
      }`}
    >
      {showPlaceholderForBoard === board.id && isHovered && (
        <div className="h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center text-primary/50 text-sm">
          Drop here
        </div>
      )}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="font-semibold text-sm">{board.name}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {tasks.length}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <IconPlus className="h-3 w-3" />
          </Button>
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto p-2 min-h-[120px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
