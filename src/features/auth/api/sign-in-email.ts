import { err, ok } from "@punpun-dev/ts-result";
import { authClient } from "@/shared/lib/auth-client";

export type AuthFormError = {
  message: string;
};

export const signInEmail = async (email: string, password: string) => {
  const result = await authClient.signIn.email({ email, password });
  if (result.error) {
    return err({ message: result.error.message || "Unable to sign in" });
  }

  return ok(undefined);
};
