"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconPencil, IconX } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

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
  members?: MemberWithUserOutput[];
};

type TaskCardContentProps = Props & {
  attributes?: DraggableAttributes;
  isOverlay?: boolean;
  listeners?: DraggableSyntheticListeners;
  setNodeRef?: (node: HTMLDivElement | null) => void;
  style?: CSSProperties;
};

export function TaskCardContent({
  attributes,
  isOverlay = false,
  listeners,
  onDelete,
  onEdit,
  setNodeRef,
  style,
  task,
  members = [],
}: TaskCardContentProps) {
  const assignee = members.find((member) => member.id === task.assigneeId);
  const assigneeLabel = assignee?.user.name || assignee?.user.email;
  const assigneeInitial = assigneeLabel?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab rounded-lg border bg-card shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md ${
        isOverlay ? "cursor-grabbing shadow-xl ring-1 ring-primary/30" : ""
      }`}
    >
      <div {...attributes} {...listeners} className="p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1 break-words font-medium text-sm leading-snug">{task.title}</span>
          <div
            className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100"
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
            className={`h-2 w-2 shrink-0 rounded-full ${
              priorityColors[task.priority as TaskPriority] ?? "bg-gray-400"
            }`}
          />
          <span className="text-muted-foreground text-xs capitalize">{task.priority}</span>
        </div>

        {assignee && assigneeLabel ? (
          <div className="mt-3 flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
            <Avatar size="sm">
              {assignee.user.image ? <AvatarImage alt="" src={assignee.user.image} /> : null}
              <AvatarFallback>{assigneeInitial}</AvatarFallback>
            </Avatar>
            <span className="truncate">{assigneeLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TaskCard({ task, onEdit, onDelete, members = [] }: Props) {
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
        className="h-[72px] rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30"
      />
    );
  }

  return (
    <TaskCardContent
      attributes={attributes}
      listeners={listeners}
      onDelete={onDelete}
      onEdit={onEdit}
      members={members}
      setNodeRef={setNodeRef}
      style={style}
      task={task}
    />
  );
}
