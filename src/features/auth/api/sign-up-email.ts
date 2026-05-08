import { err, ok } from "@punpun-dev/ts-result";
import { authClient } from "@/lib/auth-client";
import type { AuthFormError } from "./sign-in-email";

export const signUpEmail = async (email: string, name: string, password: string) => {
  const result = await authClient.signUp.email({ email, name, password });
  if (result.error) {
    return err<AuthFormError>({ message: result.error.message || "Unable to sign up" });
  }

  return ok(undefined);
};
