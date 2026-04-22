"use client";

import { SignUpForm } from "@/features/auth/components/sign-up-form.tsx";

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignUpForm />
    </div>
  );
}
