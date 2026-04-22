"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import z from "zod";
import { handle } from "@/lib/handle";
import { parseFormData } from "@/lib/parse-form-data";
import { signUpEmail } from "../api/sign-up-email";

export const useSignUpForm = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const schema = z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const action = (formData: FormData) => {
    startTransition(async () => {
      const { data, fieldErrors } = parseFormData(schema, formData);
      if (fieldErrors) {
        setFieldErrors(fieldErrors);
        return;
      }
      const { error } = await handle(signUpEmail(data.email, data.name, data.password));
      if (error) {
        setGlobalError(error);
        return;
      }
      router.push("/dashboard");
    });
  };

  return { action, fieldErrors, globalError, pending };
};
