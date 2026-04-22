import { authClient } from "@/lib/auth-client";

export const signInEmail = async (email: string, password: string) => {
  const result = await authClient.signIn.email({ email, password });
  if (result.error) {
    throw new Error(result.error.message);
  }
};
