import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(3).max(500).optional(),
});
