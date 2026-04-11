import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(2).max(32),
  email: z.email(),
  password: z.string().min(1),
});
