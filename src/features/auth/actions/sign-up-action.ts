"use server";

import { redirect } from "next/navigation";
import { createAction } from "@/lib/create-action";
import { emailSignUp } from "../functions/email-sign-up";
import { SignUpSchema } from "../schemas/sign-up-schema";

export const signUpAction = createAction({
  schema: SignUpSchema,
  fn: (data) => emailSignUp(data.name, data.email, data.password),
  onSuccess: () => {
    redirect("/dashboard");
  },
});
