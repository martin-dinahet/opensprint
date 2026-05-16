"use client";

import { IconFileText, IconFlag, IconTextCaption, IconUser } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskPriority } from "@/entities/task";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/shadcn/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from "@/shared/shadcn/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn/select";

type Props = {
  assigneeId: string | null;
  description?: string;
  disabled: boolean;
  errors?: Record<string, string[]> | null;
  members: MemberWithUserOutput[];
  priority: TaskPriority;
  setAssigneeId: (assigneeId: string | null) => void;
  setDescription?: (description: string) => void;
  setPriority: (priority: TaskPriority) => void;
  setTitle?: (title: string) => void;
  title?: string;
};

const priorityItems = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
};

const getMemberLabel = (member: MemberWithUserOutput) => member.user.name || member.user.email;

export const TaskFormFields = ({
  assigneeId,
  description,
  disabled,
  errors,
  members,
  priority,
  setAssigneeId,
  setDescription,
  setPriority,
  setTitle,
  title,
}: Props) => {
  const titleError = errors?.title?.[0];
  const descriptionError = errors?.description?.[0];
  const assigneeItems = [
    { label: "Unassigned", value: null },
    ...members.map((member) => ({ label: getMemberLabel(member), value: member.id })),
  ];

  return (
    <FieldGroup className="py-5">
      <Field data-invalid={!!titleError}>
        <FieldLabel htmlFor="taskTitle">Title</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <IconTextCaption />
          </InputGroupAddon>
          <InputGroupInput
            id="taskTitle"
            name="title"
            placeholder="Draft sprint plan"
            disabled={disabled}
            aria-invalid={!!titleError}
            value={title}
            onChange={setTitle ? (event) => setTitle(event.target.value) : undefined}
          />
        </InputGroup>
        <FieldError>{titleError}</FieldError>
      </Field>

      <Field data-invalid={!!descriptionError}>
        <FieldLabel htmlFor="taskDescription">Description</FieldLabel>
        <InputGroup>
          <InputGroupAddon align="block-start">
            <IconFileText />
            Markdown supported
          </InputGroupAddon>
          <InputGroupTextarea
            id="taskDescription"
            name="description"
            placeholder="Notes, links, checklists, or acceptance criteria"
            disabled={disabled}
            aria-invalid={!!descriptionError}
            className="min-h-56"
            value={description}
            onChange={setDescription ? (event) => setDescription(event.target.value) : undefined}
          />
        </InputGroup>
        <FieldDescription>Use Markdown for headings, lists, links, tables, and checklists.</FieldDescription>
        <FieldError>{descriptionError}</FieldError>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="taskPriority">Priority</FieldLabel>
          <input name="priority" type="hidden" value={priority} />
          <Select
            items={priorityItems}
            value={priority}
            onValueChange={(value) => setPriority(value as TaskPriority)}
            disabled={disabled}
          >
            <SelectTrigger id="taskPriority" className="w-full">
              <IconFlag />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="taskAssignee">Assignee</FieldLabel>
          <input name="assigneeId" type="hidden" value={assigneeId ?? ""} />
          <Select
            items={assigneeItems}
            value={assigneeId}
            onValueChange={(value) => setAssigneeId(typeof value === "string" ? value : null)}
            disabled={disabled}
          >
            <SelectTrigger id="taskAssignee" className="w-full">
              <IconUser />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {getMemberLabel(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </FieldGroup>
  );
};
