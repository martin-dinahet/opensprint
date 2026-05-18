"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { useCreateColumn } from "@/entities/column";
import { handleClientResult } from "@/shared";
import { parseFormData } from "@/shared";

const createColumnSchema = z.object({
  name: z.string().trim().min(1).max(130),
});

type Options = {
  onOpenChange: (open: boolean) => void;
  projectId: string;
};

export function useCreateColumnForm({ onOpenChange, projectId }: Options) {
  const createColumn = useCreateColumn();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const reset = () => {
    setFieldErrors(null);
    setGlobalError(null);
  };

  const action = (formData: FormData) => {
    startTransition(async () => {
      reset();

      const { data, fieldErrors } = parseFormData(createColumnSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }
      if (!projectId) {
        setGlobalError("Choose a project before creating a column.");
        return;
      }

      const result = await handleClientResult(
        () => createColumn.mutateAsync({ projectId, data }),
        "Unable to create column",
      );
      result.match({
        ok: () => onOpenChange(false),
        err: (error) => setGlobalError(error.message),
      });
    });
  };

  return {
    action,
    fieldErrors,
    globalError,
    pending: pending || createColumn.isPending,
    reset,
  };
}
