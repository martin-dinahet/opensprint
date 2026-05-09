"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { type TaskPriority, useCreateTask } from "@/entities/task";
import { handleClientResult } from "@/shared/api/result";
import { parseFormData } from "@/shared/lib/forms";

const defaultPriority: TaskPriority = "medium";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(3).max(2000).optional(),
  ),
  priority: z.enum(["low", "medium", "high", "urgent"]).default(defaultPriority),
  assigneeId: z.preprocess(
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
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const reset = () => {
    setFieldErrors(null);
    setGlobalError(null);
    setPriority(defaultPriority);
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
        setGlobalError("Choose a board before creating a task.");
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
    fieldErrors,
    globalError,
    pending: pending || createTask.isPending,
    priority,
    reset,
    setAssigneeId,
    setPriority,
  };
};
