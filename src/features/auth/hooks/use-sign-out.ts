"use client";

import { err, ok } from "@punpun-dev/ts-result";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

type SignOutResponse = {
  error?: {
    message?: string;
  } | null;
};

const signOut = async () => {
  try {
    const response = (await authClient.signOut()) as SignOutResponse | undefined;

    if (response?.error) {
      return err(new Error(response.error.message || "Unable to sign out"));
    }

    return ok(true);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Unable to sign out"));
  }
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
          router.refresh();
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
