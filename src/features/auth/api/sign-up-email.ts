import { err, ok } from "@punpun-dev/ts-result";
import { authClient, handleClientResult } from "@/shared";
import type { AuthFormError } from "./sign-in-email";

export const signUpEmail = async (email: string, name: string, password: string) => {
  const responseResult = await handleClientResult(
    () => authClient.signUp.email({ email, name, password }),
    "Unable to sign up",
  );
  if (responseResult.isErr()) {
    return err<AuthFormError>({ message: responseResult.error.message });
  }

  const result = responseResult.unwrap();
  if (result.error) {
    return err<AuthFormError>({ message: result.error.message || "Unable to sign up" });
  }

  return ok(undefined);
};
