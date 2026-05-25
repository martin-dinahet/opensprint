import z from "zod";

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

export const CreateProjectInput = z.object({
  name: projectName,
  defaultBoardName: z.string().trim().min(1).max(130),
  description: z.string().min(3).max(800).optional(),
});

export const UpdateProjectInput = z.object({
  name: projectName.optional(),
  description: z.string().min(3).max(800).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export const ProjectOutput = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  defaultBoardId: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
  openTaskCount: z.number().int().nonnegative(),
  status: z.enum(["active", "paused", "archived"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProjectListOutput = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  defaultBoardId: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
  openTaskCount: z.number().int().nonnegative(),
  status: z.enum(["active", "paused", "archived"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;
export type ProjectOutput = z.infer<typeof ProjectOutput>;
export type ProjectListOutput = z.infer<typeof ProjectListOutput>;
