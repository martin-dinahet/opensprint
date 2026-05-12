"use client";

import { IconCalendar, IconFlag, IconUser } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/shadcn/avatar";
import { Badge } from "@/shared/shadcn/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/shadcn/dialog";
import { Separator } from "@/shared/shadcn/separator";

type Props = {
  members: MemberWithUserOutput[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  task: TaskOutput | null;
};

const getMemberLabel = (member: MemberWithUserOutput) => member.user.name || member.user.email;

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
            <div className="grid gap-3 sm:grid-cols-3">
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
                <div className="max-w-none rounded-md border bg-background p-4 text-sm leading-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node: _node, ...props }) => (
                        <a
                          className="font-medium underline underline-offset-4"
                          rel="noreferrer"
                          target="_blank"
                          {...props}
                        />
                      ),
                      code: ({ node: _node, ...props }) => (
                        <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props} />
                      ),
                      h1: ({ node: _node, ...props }) => <h1 className="mb-2 font-semibold text-lg" {...props} />,
                      h2: ({ node: _node, ...props }) => <h2 className="mb-2 font-semibold text-base" {...props} />,
                      li: ({ node: _node, ...props }) => <li className="ml-4 list-disc" {...props} />,
                      p: ({ node: _node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                      pre: ({ node: _node, ...props }) => (
                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs" {...props} />
                      ),
                      ul: ({ node: _node, ...props }) => <ul className="mb-3 flex flex-col gap-1" {...props} />,
                    }}
                  >
                    {task.description}
                  </ReactMarkdown>
                </div>
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
