"use client";

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/shared/lib/auth-client";
import { LoadingScreen } from "@/shared/shadcn/loading-screen";
import { SidebarInset, SidebarProvider } from "@/shared/shadcn/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const session = authClient.useSession();

  if (session.isPending) return <LoadingScreen label="Opening workspace..." variant="shell" />;
  if (!session.data?.user) redirect("/sign-in");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-[calc(100svh-1rem)] overflow-hidden border border-border/70">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
