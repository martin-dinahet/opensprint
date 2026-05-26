import { IconCalendar, IconFlag, IconHash, IconUser, IconVersions } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import { getMemberLabel } from "@/entities/member/lib";
import type { TaskKind, TaskPriority } from "@/entities/task";
import { taskKindItems, taskPriorityItems } from "@/entities/task/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/shared";

type Props = {
  assigneeId: string | null;
  description: string;
  dueDate: string;
  estimate: number | null;
  kind: TaskKind;
  members: MemberWithUserOutput[];
  priority: TaskPriority;
  setAssigneeId: (assigneeId: string | null) => void;
  setDescription: (description: string) => void;
  setDueDate: (dueDate: string) => void;
  setEstimate: (estimate: number | null) => void;
  setKind: (kind: TaskKind) => void;
  setPriority: (priority: TaskPriority) => void;
  setTitle: (title: string) => void;
  title: string;
};

export function TaskSheetDetailsFields({
  assigneeId,
  description,
  dueDate,
  estimate,
  kind,
  members,
  priority,
  setAssigneeId,
  setDescription,
  setDueDate,
  setEstimate,
  setKind,
  setPriority,
  setTitle,
  title,
}: Props) {
  const detailFieldClassName = "min-w-0 space-y-2";
  const detailControlClassName = "!h-9 w-full min-w-0";

  return (
    <>
      <section className="space-y-2">
        <Label htmlFor="task-sheet-title">Title</Label>
        <Input id="task-sheet-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </section>

      <section className="grid gap-3 rounded-md border bg-muted/10 p-3 sm:grid-cols-2">
        <div className={detailFieldClassName}>
          <Label htmlFor="task-sheet-kind" className="text-xs">
            Kind
          </Label>
          <Select items={taskKindItems} value={kind} onValueChange={(value) => setKind(value as TaskKind)}>
            <SelectTrigger id="task-sheet-kind" className={detailControlClassName}>
              <IconVersions />
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="chore">Chore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={detailFieldClassName}>
          <Label htmlFor="task-sheet-priority" className="text-xs">
            Priority
          </Label>
          <Select
            items={taskPriorityItems}
            value={priority}
            onValueChange={(value) => setPriority(value as TaskPriority)}
          >
            <SelectTrigger id="task-sheet-priority" className={detailControlClassName}>
              <IconFlag />
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={detailFieldClassName}>
          <Label htmlFor="task-sheet-estimate" className="text-xs">
            Estimate
          </Label>
          <div className="relative">
            <IconHash className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="task-sheet-estimate"
              className={`${detailControlClassName} pl-8`}
              type="number"
              min={1}
              max={99}
              value={estimate ?? ""}
              onChange={(event) => setEstimate(event.target.value ? Number(event.target.value) : null)}
            />
          </div>
        </div>

        <div className={detailFieldClassName}>
          <Label className="text-xs">Assignee</Label>
          <Select
            items={[
              { label: "Unassigned", value: null },
              ...members.map((member) => ({ label: getMemberLabel(member), value: member.id })),
            ]}
            value={assigneeId}
            onValueChange={(value) => setAssigneeId(typeof value === "string" ? value : null)}
          >
            <SelectTrigger className={detailControlClassName}>
              <IconUser />
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm">
                      {member.user.image ? <AvatarImage alt="" src={member.user.image} /> : null}
                      <AvatarFallback>{getMemberLabel(member).trim().charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{getMemberLabel(member)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={detailFieldClassName}>
          <Label htmlFor="task-sheet-due-date" className="text-xs">
            Due date
          </Label>
          <div className="relative">
            <IconCalendar className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="task-sheet-due-date"
              className={`${detailControlClassName} pl-8`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="task-sheet-description">Description</Label>
        <Textarea
          id="task-sheet-description"
          className="min-h-28 whitespace-pre-wrap"
          placeholder="Add notes, acceptance criteria, or links…"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </section>
    </>
  );
}
