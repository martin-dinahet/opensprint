import { err, ok } from "@punpun-dev/ts-result";
import { handleClientResult } from "@/shared/api/result";
import { authClient } from "@/shared/lib/auth-client";

export type AuthFormError = {
  message: string;
};

export const signInEmail = async (email: string, password: string) => {
  const responseResult = await handleClientResult(
    () => authClient.signIn.email({ email, password }),
    "Unable to sign in",
  );
  if (responseResult.isErr()) {
    return err({ message: responseResult.error.message });
  }

  const result = responseResult.unwrap();
  if (result.error) {
    return err({ message: result.error.message || "Unable to sign in" });
  }

  return ok(undefined);
};
