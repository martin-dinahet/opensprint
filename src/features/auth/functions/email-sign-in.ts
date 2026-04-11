import { auth } from "@/lib/auth";
import { handle } from "@/lib/handle";

export async function emailSignIn(email: string, password: string) {
  const result = await handle(auth.api.signInEmail({ body: { email, password } }));
  if (result.error) throw new Error(result.error);
}
