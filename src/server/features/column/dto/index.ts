import z from "zod";

export const CreateColumnInput = z.object({
  name: z.string().min(1).max(130),
});

export const UpdateColumnInput = z.object({
  name: z.string().min(1).max(130).optional(),
  position: z.number().int().min(0).optional(),
});

export const ReorderColumnsInput = z.object({
  columnIds: z.array(z.string()),
});

export const ColumnOutput = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateColumnInput = z.infer<typeof CreateColumnInput>;
export type UpdateColumnInput = z.infer<typeof UpdateColumnInput>;
export type ReorderColumnsInput = z.infer<typeof ReorderColumnsInput>;
export type ColumnOutput = z.infer<typeof ColumnOutput>;
