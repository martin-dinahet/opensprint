"use client";

import { useState, useTransition } from "react";
import z from "zod";
import { useCreateBoard } from "@/entities/board";
import { handleClientResult } from "@/shared/api/result";
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

      const result = await handleClientResult(
        () => createBoard.mutateAsync({ data, projectId }),
        "Unable to create board",
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
    pending: pending || createBoard.isPending,
    reset,
  };
}
