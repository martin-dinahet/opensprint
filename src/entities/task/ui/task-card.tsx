"use client";

import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { TaskCardContent, type TaskCardProps } from "./task-card-content";

export const TaskCard = ({ task, onDelete, onOpen, members = [] }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
    animateLayoutChanges: (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[88px] border-2 border-dashed border-muted-foreground/40 bg-muted/30"
      />
    );
  }

  return (
    <TaskCardContent
      attributes={attributes}
      listeners={listeners}
      onDelete={onDelete}
      onOpen={onOpen}
      members={members}
      setNodeRef={setNodeRef}
      style={style}
      task={task}
    />
  );
};

export { TaskCardContent };
