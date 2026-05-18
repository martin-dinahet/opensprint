"use client";

import { useEffect, useState, useTransition } from "react";
import z from "zod";
import { type TaskOutput, type TaskPriority, useAssignTask, useUpdateTask } from "@/entities/task";
import { handleClientResult } from "@/shared";
import { parseFormData } from "@/shared";

const editTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(2000).optional(),
  ),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().nullable(),
  ),
});

type Options = {
  onOpenChange: (open: boolean) => void;
  task: TaskOutput | null;
};

export const useEditTaskForm = ({ onOpenChange, task }: Options) => {
  const updateTask = useUpdateTask();
  const assignTask = useAssignTask();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setAssigneeId(task?.assigneeId ?? null);
    setFieldErrors(null);
    setGlobalError(null);
  }, [task]);

  const reset = () => {
    setFieldErrors(null);
    setGlobalError(null);
  };

  const action = (formData: FormData) => {
    startTransition(async () => {
      reset();

      if (!task) return;

      const { data, fieldErrors } = parseFormData(editTaskSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }

      const result = await handleClientResult(async () => {
        await updateTask.mutateAsync({
          columnId: task.columnId,
          data: {
            description: data.description,
            priority: data.priority,
            title: data.title,
          },
          taskId: task.id,
        });

        if (data.assigneeId !== task.assigneeId) {
          await assignTask.mutateAsync({ assigneeId: data.assigneeId, taskId: task.id });
        }
      }, "Unable to update task");

      result.match({
        ok: () => onOpenChange(false),
        err: (error) => setGlobalError(error.message),
      });
    });
  };

  return {
    action,
    assigneeId,
    description,
    fieldErrors,
    globalError,
    pending: pending || updateTask.isPending || assignTask.isPending,
    priority,
    reset,
    setAssigneeId,
    setDescription,
    setPriority,
    setTitle,
    title,
  };
};
