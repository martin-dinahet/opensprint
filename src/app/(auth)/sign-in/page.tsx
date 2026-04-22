"use client";

import { SignInForm } from "@/features/auth/components/sign-in-form.tsx";

export default function SignInPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignInForm />
    </div>
  );
}
