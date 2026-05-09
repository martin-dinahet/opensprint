"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { useCreateColumn } from "@/entities/column";
import { handleClientResult } from "@/shared/api/result";
import { parseFormData } from "@/shared/lib/forms";

const createColumnSchema = z.object({
  name: z.string().trim().min(1).max(130),
});

type Options = {
  boardId: string;
  onOpenChange: (open: boolean) => void;
};

export function useCreateColumnForm({ boardId, onOpenChange }: Options) {
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

      const result = await handleClientResult(
        () => createColumn.mutateAsync({ boardId, data }),
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
