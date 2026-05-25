"use client";

import { IconCalendar, IconFlag, IconHash, IconUser, IconVersions } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import { getMemberLabel } from "@/entities/member/lib";
import type { TaskOutput } from "@/entities/task";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@/shared";

type Props = {
  members: MemberWithUserOutput[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  task: TaskOutput | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
};

export const TaskDetailDialog = ({ members, onOpenChange, open, task }: Props) => {
  const assignee = members.find((member) => member.id === task?.assigneeId);
  const assigneeLabel = assignee ? getMemberLabel(assignee) : "Unassigned";
  const assigneeInitial = assigneeLabel.trim().charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100svh-2rem))] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-xl leading-tight">{task?.title ?? "Task"}</DialogTitle>
          <DialogDescription>Task details</DialogDescription>
        </DialogHeader>

        {task ? (
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <IconVersions className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Kind</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {task.kind}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <IconFlag className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Priority</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {task.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <IconUser className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Assignee</p>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    {assignee ? (
                      <Avatar size="sm">
                        {assignee.user.image ? <AvatarImage alt="" src={assignee.user.image} /> : null}
                        <AvatarFallback>{assigneeInitial}</AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="truncate text-sm">{assigneeLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <IconHash className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Estimate</p>
                  <p className="mt-1 truncate text-sm">{task.estimate ? `${task.estimate} points` : "Unestimated"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <IconCalendar className="size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Due date</p>
                  <p className="mt-1 truncate text-sm">{formatDate(task.dueDate)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="font-medium text-sm">Description</h3>
              {task.description ? (
                <p className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-6">
                  {task.description}
                </p>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
                  No description yet.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
