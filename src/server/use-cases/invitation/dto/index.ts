import z from "zod";

const InvitationRole = z.enum(["admin", "member"]);
const InvitationStatus = z.enum(["pending", "accepted", "declined", "canceled", "expired"]);

export const CreateInvitationInput = z.object({
  email: z.string().trim().email(),
  role: InvitationRole,
});

export const InvitationOutput = z.object({
  id: z.string(),
  projectId: z.string(),
  email: z.string(),
  role: InvitationRole,
  status: InvitationStatus,
  expiresAt: z.date(),
  createdAt: z.date(),
  inviter: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
  }),
  project: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationInput>;
export type InvitationOutput = z.infer<typeof InvitationOutput>;
