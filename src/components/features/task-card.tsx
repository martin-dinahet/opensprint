"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconPencil, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { TaskOutput } from "@/lib/types";

type TaskPriority = "low" | "medium" | "high" | "urgent";

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

type Props = {
  task: TaskOutput;
  onEdit: (task: TaskOutput) => void;
  onDelete: (taskId: string) => void;
  /** Render a ghost/placeholder appearance when this card is being dragged */
  isOverlay?: boolean;
};

export function TaskCard({ task, onEdit, onDelete, isOverlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[68px] rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab active:cursor-grabbing bg-card rounded-lg border shadow-sm transition-shadow hover:shadow-md ${
        isOverlay ? "rotate-1 scale-105 shadow-xl ring-1 ring-primary/30 cursor-grabbing" : ""
      }`}
    >
      {/* Drag handle area — whole card is draggable except the buttons */}
      <div {...attributes} {...listeners} className="p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm leading-snug flex-1 min-w-0 break-words">{task.title}</span>
          {/* Buttons are outside the drag listeners via stopPropagation */}
          <div
            className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <IconPencil className="h-3 w-3" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <IconX className="h-3 w-3" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              priorityColors[task.priority as TaskPriority] ?? "bg-gray-400"
            }`}
          />
          <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
        </div>
      </div>
    </div>
  );
}
