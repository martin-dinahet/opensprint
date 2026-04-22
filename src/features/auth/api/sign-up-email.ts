import { authClient } from "@/lib/auth-client";

export const signUpEmail = async (email: string, name: string, password: string) => {
  const result = await authClient.signUp.email({ email, name, password });
  if (result.error) {
    throw new Error(result.error.message);
  }
};
