"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import z from "zod";
import { useCreateProject } from "@/entities/project";
import { handleClientResult } from "@/shared";
import { parseFormData } from "@/shared";

const createProjectSchema = z.object({
  name: z.string().trim().min(3).max(130),
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
          router.push(`/projects/${project.id}`);
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
