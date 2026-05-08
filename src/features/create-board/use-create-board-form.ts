"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { useCreateBoard } from "@/entities/board";
import { parseFormData } from "@/shared/lib/forms";

const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(130),
});

type Options = {
  onOpenChange: (open: boolean) => void;
  projectId: string;
};

export function useCreateBoardForm({ onOpenChange, projectId }: Options) {
  const createBoard = useCreateBoard();
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

      const { data, fieldErrors } = parseFormData(createBoardSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }

      try {
        await createBoard.mutateAsync({ data, projectId });
        onOpenChange(false);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to create column");
      }
    });
  };

  return {
    action,
    fieldErrors,
    globalError,
    pending: pending || createBoard.isPending,
    reset,
  };
}
