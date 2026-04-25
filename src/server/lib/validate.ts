import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

export function validate<T extends ZodType>(target: "json", schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".") || "root";
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return c.json({ success: false, errors: errors }, 403);
    }
  });
}
