import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import {
  IconBug,
  IconCalendar,
  IconChecks,
  IconFlag,
  IconGripVertical,
  IconHash,
  IconSparkles,
  IconTool,
  IconTrash,
  IconUser,
  IconVersions,
} from "@tabler/icons-react";
import type { CSSProperties } from "react";
import type { MemberWithUserOutput } from "@/entities/member";
import { getMemberLabel } from "@/entities/member/lib";
import type { TaskKind, TaskOutput, TaskPriority } from "@/entities/task";
import { Avatar, AvatarFallback, AvatarImage, Button, cn } from "@/shared";

const priorityColors: Record<TaskPriority, string> = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
  urgent: "text-priority-urgent",
};

const kindMeta: Record<TaskKind, { icon: typeof IconVersions; label: string }> = {
  bug: { icon: IconBug, label: "Bug" },
  chore: { icon: IconTool, label: "Chore" },
  feature: { icon: IconSparkles, label: "Feature" },
  task: { icon: IconVersions, label: "Task" },
};

export type TaskCardProps = {
  task: TaskOutput;
  onOpen: (task: TaskOutput) => void;
  onDelete: (taskId: string) => void;
  members?: MemberWithUserOutput[];
};

export type TaskCardContentProps = TaskCardProps & {
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
  onOpen,
  setNodeRef,
  style,
  task,
  members = [],
}: TaskCardContentProps) => {
  const assignee = members.find((member) => member.id === task.assigneeId);
  const assigneeLabel = assignee ? getMemberLabel(assignee) : undefined;
  const assigneeInitial = assigneeLabel?.trim().charAt(0).toUpperCase() ?? "";
  const doneItems = task.items.filter((item) => item.done).length;
  const hasChecklist = task.items.length > 0;
  const KindIcon = kindMeta[task.kind]?.icon ?? IconVersions;
  const kindLabel = kindMeta[task.kind]?.label ?? task.kind;
  const dueDate = task.dueDate
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(task.dueDate))
    : null;

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab border bg-card outline-none transition-colors active:cursor-grabbing hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-within:bg-background",
        isOverlay && "cursor-grabbing ring-2 ring-ring",
      )}
    >
      <button type="button" className="block w-full p-3.5 pr-10 text-left" onClick={() => onOpen(task)}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
            <IconGripVertical className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Drag task</span>
          </span>
          <div className="min-w-0 flex-1 text-left">
            <span className="block min-w-0 break-words font-medium text-sm leading-snug">{task.title}</span>

            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.68rem] text-muted-foreground uppercase tracking-wide">
              <span className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5">
                <KindIcon className="h-3 w-3" />
                {kindLabel}
              </span>
              <span className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5">
                <IconFlag className={`h-3 w-3 ${priorityColors[task.priority] ?? "text-muted-foreground"}`} />
                {task.priority}
              </span>
              {task.estimate ? (
                <span className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5">
                  <IconHash className="h-3 w-3" />
                  {task.estimate}
                </span>
              ) : null}
            </span>

            {task.tags.length > 0 ? (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {task.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex max-w-32 items-center gap-1 border bg-muted/35 px-2 py-0.5 text-muted-foreground text-xs"
                  >
                    <span className="size-1.5 shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                  </span>
                ))}
              </span>
            ) : null}

            <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                {assignee && assigneeLabel ? (
                  <Avatar size="sm">
                    {assignee.user.image ? <AvatarImage alt="" src={assignee.user.image} /> : null}
                    <AvatarFallback>{assigneeInitial}</AvatarFallback>
                  </Avatar>
                ) : (
                  <IconUser className="h-3 w-3" />
                )}
                <span className="max-w-28 truncate">{assigneeLabel ?? "Unassigned"}</span>
              </span>
              {hasChecklist ? (
                <span className="inline-flex items-center gap-1">
                  <IconChecks className="h-3 w-3" />
                  {doneItems}/{task.items.length}
                </span>
              ) : null}
              {dueDate ? (
                <span className="inline-flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  {dueDate}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 text-muted-foreground/60 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(task.id);
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <IconTrash className="h-3 w-3" />
        <span className="sr-only">Delete task</span>
      </Button>
    </div>
  );
};
