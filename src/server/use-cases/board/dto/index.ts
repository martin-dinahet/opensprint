import z from "zod";

export const CreateBoardInput = z.object({
  name: z.string().min(1).max(130),
});

export const UpdateBoardInput = z.object({
  name: z.string().min(1).max(130).optional(),
  position: z.number().int().min(0).optional(),
});

export const ReorderBoardsInput = z.object({
  boardIds: z.array(z.string()),
});

export const BoardOutput = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardInput>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardInput>;
export type ReorderBoardsInput = z.infer<typeof ReorderBoardsInput>;
export type BoardOutput = z.infer<typeof BoardOutput>;
