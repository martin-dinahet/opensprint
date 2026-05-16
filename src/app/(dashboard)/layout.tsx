"use client";

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/shared/lib/auth-client";
import { LoadingScreen } from "@/shared/shadcn/loading-screen";
import { DashboardHeaderProvider, HeaderWidget } from "@/widgets/header";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const session = authClient.useSession();

  if (session.isPending) return <LoadingScreen label="Opening workspace..." variant="shell" />;
  if (!session.data?.user) redirect("/sign-in");

  return (
    <DashboardHeaderProvider>
      <div className="flex min-h-svh flex-col overflow-hidden bg-background">
        <HeaderWidget />
        {children}
      </div>
    </DashboardHeaderProvider>
  );
}
