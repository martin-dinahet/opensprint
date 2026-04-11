import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}
