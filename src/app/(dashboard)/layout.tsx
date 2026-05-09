"use client";

import type { ReactNode } from "react";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";
import { authClient } from "@/shared/lib/auth-client";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const session = authClient.useSession();

  if (session.isPending) return <LoadingScreen />;
  if (!session.data?.user) return <LoadingScreen />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-[calc(100svh-1rem)] overflow-hidden border border-border/70">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
