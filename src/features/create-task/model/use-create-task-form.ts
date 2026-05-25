"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { type TaskKind, type TaskPriority, useCreateTask } from "@/entities/task";
import { handleClientResult, parseFormData } from "@/shared";

const defaultPriority: TaskPriority = "medium";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(2000).optional(),
  ),
  priority: z.enum(["low", "medium", "high", "urgent"]).default(defaultPriority),
  kind: z.enum(["task", "bug", "feature", "chore"]).default("task"),
  estimate: z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return Number(value);
  }, z.number().int().positive().max(99).optional()),
  assigneeId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().optional(),
  ),
  dueDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().optional(),
  ),
});

type Options = {
  columnId: string;
  onOpenChange: (open: boolean) => void;
};

export const useCreateTaskForm = ({ columnId, onOpenChange }: Options) => {
  const createTask = useCreateTask();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [kind, setKind] = useState<TaskKind>("task");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const reset = () => {
    setFieldErrors(null);
    setGlobalError(null);
    setPriority(defaultPriority);
    setKind("task");
    setEstimate(null);
    setAssigneeId(null);
  };

  const action = (formData: FormData) => {
    startTransition(async () => {
      setFieldErrors(null);
      setGlobalError(null);

      const { data, fieldErrors } = parseFormData(createTaskSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }
      if (!columnId) {
        setGlobalError("Choose a column before creating a task.");
        return;
      }

      const result = await handleClientResult(
        () => createTask.mutateAsync({ columnId, data }),
        "Unable to create task",
      );
      result.match({
        ok: () => {
          reset();
          onOpenChange(false);
        },
        err: (error) => setGlobalError(error.message),
      });
    });
  };

  return {
    action,
    assigneeId,
    estimate,
    fieldErrors,
    globalError,
    kind,
    pending: pending || createTask.isPending,
    priority,
    reset,
    setAssigneeId,
    setEstimate,
    setKind,
    setPriority,
  };
};
