import z from "zod";

export const AddMemberInput = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export const UpdateMemberInput = z.object({
  role: z.enum(["admin", "member"]),
});

export const MemberOutput = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  role: z.enum(["owner", "admin", "member"]),
  joinedAt: z.date(),
});

export const MemberWithUserOutput = MemberOutput.extend({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

export type AddMemberInput = z.infer<typeof AddMemberInput>;
export type UpdateMemberInput = z.infer<typeof UpdateMemberInput>;
export type MemberOutput = z.infer<typeof MemberOutput>;
export type MemberWithUserOutput = z.infer<typeof MemberWithUserOutput>;
