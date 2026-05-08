"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import z from "zod";
import { parseFormData } from "@/shared/lib/forms";
import { signInEmail } from "../api/sign-in-email";

export const useSignInForm = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const schema = z.object({
    email: z.email(),
    password: z.string(),
  });

  const action = (formData: FormData) => {
    startTransition(async () => {
      const { data, fieldErrors } = parseFormData(schema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }
      const result = await signInEmail(data.email, data.password);
      if (result.isErr()) {
        setGlobalError(result.error.message);
        return;
      }
      router.push("/dashboard");
    });
  };

  return { action, fieldErrors, globalError, pending };
};
