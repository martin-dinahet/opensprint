import type { ZodType } from "zod";
import { parseErrors } from "./parse-errors";

export const parseFormData = <T>(schema: ZodType<T>, formData: FormData) => {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { data: null, fieldErrors: parseErrors(parsed.error) };
  return { data: parsed.data, fieldErrors: undefined };
};
