"use client";

import { SignInForm } from "@/features/auth";

export function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-4">
      <SignInForm />
    </div>
  );
}
