"use client";

import { SignUpForm } from "@/features/auth";

export default function Page() {
  return (
    <div className="grid min-h-svh w-full place-items-center border-[12px] border-foreground bg-background p-4">
      <SignUpForm />
    </div>
  );
}
