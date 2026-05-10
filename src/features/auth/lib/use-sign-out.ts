"use client";

import { err, ok, type Result } from "@punpun-dev/ts-result";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { handleClientResult } from "@/shared/api/result";
import { authClient } from "@/shared/lib/auth-client";

type SignOutResponse = {
  error?: {
    message?: string;
  } | null;
};

const signOut = async (): Promise<Result<boolean, Error>> => {
  const responseResult = await handleClientResult(
    () => authClient.signOut() as Promise<SignOutResponse | undefined>,
    "Unable to sign out",
  );
  if (responseResult.isErr()) {
    return err(responseResult.error);
  }

  const response = responseResult.unwrap();
  if (response?.error) {
    return err(new Error(response.error.message || "Unable to sign out"));
  }

  return ok(true);
};

export const useSignOut = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const action = () => {
    setError(null);

    startTransition(async () => {
      const result = await signOut();

      result.match({
        ok: () => {
          router.replace("/sign-in");
        },
        err: (signOutError) => setError(signOutError.message),
      });
    });
  };

  return {
    action,
    error,
    icon: pending ? IconLoader2 : IconLogout,
    pending,
  };
};
