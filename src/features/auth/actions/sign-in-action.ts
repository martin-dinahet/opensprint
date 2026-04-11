"use server";

import { redirect } from "next/navigation";
import { createAction } from "@/lib/create-action";
import { emailSignIn } from "../functions/email-sign-in";
import { SignInSchema } from "../schemas/sign-in-schema";

export const signInAction = createAction({
  schema: SignInSchema,
  fn: (data) => emailSignIn(data.email, data.password),
  onSuccess: () => {
    redirect("/dashboard");
  },
});
