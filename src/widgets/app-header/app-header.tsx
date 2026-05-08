"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type Props = {
  className?: string;
  leading?: ReactNode;
};

export function AppHeader({ className, leading }: Props) {
  const signOut = useSignOut();
  const SignOutIcon = signOut.icon;

  return (
    <header className={cn("flex h-14 items-center justify-between border-b px-4 sm:px-6", className)}>
      {leading ?? (
        <Link href="/dashboard" className="font-semibold tracking-tight">
          OpenSprint
        </Link>
      )}
      <div className="flex items-center gap-3">
        {signOut.error && <p className="hidden text-destructive text-sm sm:block">{signOut.error}</p>}
        <Button variant="ghost" size="sm" onClick={signOut.action} disabled={signOut.pending}>
          <SignOutIcon className={cn("mr-2 h-4 w-4", signOut.pending && "animate-spin")} />
          Sign out
        </Button>
      </div>
    </header>
  );
}
