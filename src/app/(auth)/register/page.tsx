import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <RegisterForm />
    </div>
  );
}
