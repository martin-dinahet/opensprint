import { auth } from "@/lib/auth";
import { handle } from "@/lib/handle";

export async function emailSignUp(name: string, email: string, password: string) {
  const result = await handle(auth.api.signUpEmail({ body: { name, email, password } }));
  if (result.error) throw new Error(result.error);
}
