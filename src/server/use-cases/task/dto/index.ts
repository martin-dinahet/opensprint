import z from "zod";

export const CreateTaskInput = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({ title: z.string().trim().min(1).max(300) })).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const UpdateTaskInput = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
});

export const AssignTaskInput = z.object({
  assigneeId: z.string().nullable(),
});

export const MoveTaskInput = z.object({
  columnId: z.string(),
  position: z.number().int().min(0).optional(),
});

export const ReorderTaskInput = z.object({
  position: z.number().int().min(0),
});

export const CreateTaskItemInput = z.object({
  title: z.string().trim().min(1).max(300),
});

export const UpdateTaskItemInput = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  done: z.boolean().optional(),
});

export const ReorderTaskItemsInput = z.object({
  itemIds: z.array(z.string()).min(1),
});

export const CreateProjectTaskTagInput = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(40),
});

export const UpdateProjectTaskTagInput = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().trim().min(1).max(40).optional(),
});

export const AttachTaskTagInput = z.object({
  tagId: z.string(),
});

export const TaskOutput = z.object({
  id: z.string(),
  columnId: z.string(),
  assigneeId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  position: z.number(),
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInput>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;
export type AssignTaskInput = z.infer<typeof AssignTaskInput>;
export type MoveTaskInput = z.infer<typeof MoveTaskInput>;
export type ReorderTaskInput = z.infer<typeof ReorderTaskInput>;
export type CreateTaskItemInput = z.infer<typeof CreateTaskItemInput>;
export type UpdateTaskItemInput = z.infer<typeof UpdateTaskItemInput>;
export type ReorderTaskItemsInput = z.infer<typeof ReorderTaskItemsInput>;
export type CreateProjectTaskTagInput = z.infer<typeof CreateProjectTaskTagInput>;
export type UpdateProjectTaskTagInput = z.infer<typeof UpdateProjectTaskTagInput>;
export type AttachTaskTagInput = z.infer<typeof AttachTaskTagInput>;
export type TaskOutput = z.infer<typeof TaskOutput>;
