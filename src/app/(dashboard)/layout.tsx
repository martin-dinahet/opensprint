"use client";

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authClient, LoadingScreen, SidebarInset, SidebarProvider } from "@/shared";
import { AppSidebar } from "@/widgets/app-sidebar";
import { DashboardHeaderProvider, HeaderWidget } from "@/widgets/header";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const session = authClient.useSession();

  if (session.isPending) return <LoadingScreen label="Opening workspace…" variant="shell" />;
  if (!session.data?.user) redirect("/sign-in");

  return (
    <DashboardHeaderProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-svh overflow-hidden md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
          <HeaderWidget />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </DashboardHeaderProvider>
  );
}
