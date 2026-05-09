"use client";

import { SignUpForm } from "@/features/auth";

export function SignUpPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-4">
      <SignUpForm />
    </div>
  );
}
