import z from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  image: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url("Enter a valid image URL").optional(),
  ),
});

export type UpdateUserResponse = {
  error?: {
    message?: string;
  } | null;
};
