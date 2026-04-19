import z from "zod";

export const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(3).max(80).optional(),
  description: z.string().min(3).max(500).optional(),
});
