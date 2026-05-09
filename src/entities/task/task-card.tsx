"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconDotsVertical, IconEye, IconGripVertical, IconPencil, IconX } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

type TaskPriority = "low" | "medium" | "high" | "urgent";

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

type Props = {
  task: TaskOutput;
  onView: (task: TaskOutput) => void;
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

export const TaskCardContent = ({
  attributes,
  isOverlay = false,
  listeners,
  onDelete,
  onEdit,
  onView,
  setNodeRef,
  style,
  task,
  members = [],
}: TaskCardContentProps) => {
  const assignee = members.find((member) => member.id === task.assigneeId);
  const assigneeLabel = assignee?.user.name || assignee?.user.email;
  const assigneeInitial = assigneeLabel?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab rounded-lg border bg-card shadow-sm outline-none transition-shadow active:cursor-grabbing hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-within:shadow-md",
        isOverlay && "cursor-grabbing shadow-xl ring-1 ring-primary/30",
      )}
    >
      <button type="button" className="block w-full p-3 pr-9 text-left" onClick={() => onView(task)}>
        <div className="flex items-start gap-1.5">
          <span className="mt-1 flex size-5 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
            <IconGripVertical className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Drag task</span>
          </span>
          <div className="min-w-0 flex-1 px-1.5 py-0.5 text-left">
            <span className="block min-w-0 break-words font-medium text-sm leading-snug">{task.title}</span>

            <span className="mt-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  priorityColors[task.priority as TaskPriority] ?? "bg-gray-400"
                }`}
              />
              <span className="text-muted-foreground text-xs capitalize">{task.priority}</span>
            </span>

            {assignee && assigneeLabel ? (
              <span className="mt-3 flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                <Avatar size="sm">
                  {assignee.user.image ? <AvatarImage alt="" src={assignee.user.image} /> : null}
                  <AvatarFallback>{assigneeInitial}</AvatarFallback>
                </Avatar>
                <span className="truncate">{assigneeLabel}</span>
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 aria-expanded:opacity-100"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            />
          }
        >
          <IconDotsVertical className="h-3.5 w-3.5" />
          <span className="sr-only">Task actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(task)}>
            <IconEye />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <IconPencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}>
            <IconX />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const TaskCard = ({ task, onDelete, onEdit, onView, members = [] }: Props) => {
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
      onView={onView}
      members={members}
      setNodeRef={setNodeRef}
      style={style}
      task={task}
    />
  );
};
