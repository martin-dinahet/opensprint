"use client";

import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "../functions/sign-out";

export function SignOutButton() {
  const [pending, statTransition] = useTransition();

  const handleLogout = () => {
    statTransition(() => signOut());
  };

  return (
    <Button onClick={handleLogout} disabled={pending}>
      {pending ? (
        <>
          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Logging out...
        </>
      ) : (
        <>
          <IconLogout className="h-4 w-4" /> Log Out
        </>
      )}
    </Button>
  );
}
