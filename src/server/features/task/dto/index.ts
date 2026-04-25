import z from "zod";

export const CreateTaskInput = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(3).max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export const UpdateTaskInput = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(3).max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
});

export const AssignTaskInput = z.object({
  assigneeId: z.string().nullable(),
});

export const MoveTaskInput = z.object({
  boardId: z.string(),
  position: z.number().int().min(0).optional(),
});

export const ReorderTaskInput = z.object({
  position: z.number().int().min(0),
});

export const TaskOutput = z.object({
  id: z.string(),
  boardId: z.string(),
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
export type TaskOutput = z.infer<typeof TaskOutput>;
