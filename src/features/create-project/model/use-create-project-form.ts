"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import z from "zod";
import { useCreateProject } from "@/entities/project";
import { handleClientResult, parseFormData } from "@/shared";

const projectName = z
  .string()
  .trim()
  .min(3)
  .max(130)
  .refine((value) => /[\p{L}\p{N}]/u.test(value), "Use at least one letter or number")
  .refine((value) => !/[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/u.test(value), "Remove unsupported characters")
  .refine(
    (value) => /^[\p{L}\p{N}\p{M}\s._'’&()+:/-]+$/u.test(value),
    "Use letters, numbers, spaces, and basic punctuation",
  );

const createProjectSchema = z.object({
  name: projectName,
  defaultBoardName: z.string().trim().min(1, "Board name is required").max(130),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(3).max(800).optional(),
  ),
});

type Options = {
  onOpenChange: (open: boolean) => void;
};

export function useCreateProjectForm({ onOpenChange }: Options) {
  const router = useRouter();
  const createProject = useCreateProject();
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

      const { data, fieldErrors } = parseFormData(createProjectSchema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }

      const result = await handleClientResult(() => createProject.mutateAsync(data), "Unable to create project");
      result.match({
        ok: (project) => {
          onOpenChange(false);
          toast.success(`Project created with board "${data.defaultBoardName}"`);
          router.push(
            project.defaultBoardId
              ? `/projects/${project.id}/boards/${project.defaultBoardId}`
              : `/projects/${project.id}`,
          );
        },
        err: (error) => setGlobalError(error.message),
      });
    });
  };

  return {
    action,
    fieldErrors,
    globalError,
    pending: pending || createProject.isPending,
    reset,
  };
}
