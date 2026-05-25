"use client";

import { SignInForm } from "@/features/auth";

export default function Page() {
  return (
    <div className="grid min-h-svh w-full place-items-center border-[12px] border-foreground bg-background p-4">
      <SignInForm />
    </div>
  );
}
