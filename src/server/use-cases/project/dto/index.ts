import z from "zod";

export const CreateProjectInput = z.object({
  name: z.string().min(3).max(130),
  description: z.string().min(3).max(800).optional(),
});

export const UpdateProjectInput = z.object({
  name: z.string().min(3).max(130).optional(),
  description: z.string().min(3).max(800).optional(),
});

export const ProjectOutput = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProjectListOutput = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;
export type ProjectOutput = z.infer<typeof ProjectOutput>;
export type ProjectListOutput = z.infer<typeof ProjectListOutput>;
