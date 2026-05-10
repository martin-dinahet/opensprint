"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail } from "@/shared/ui/sidebar";
import { AppSidebarProvider, useAppSidebar } from "../lib/app-sidebar-context";
import { AccountMenu } from "./account-menu";
import { ProjectList } from "./project-list";
import { ProjectNavigation } from "./project-navigation";
import { SidebarBrand } from "./sidebar-brand";
import { WorkspaceNavigation } from "./workspace-navigation";

function AppSidebarLayout() {
  const { createProjectOpen, setCreateProjectOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarBrand />
        <SidebarContent className="gap-1 px-1 pb-2">
          <WorkspaceNavigation />
          <ProjectList />
          <ProjectNavigation />
        </SidebarContent>
        <AccountMenu />
        <SidebarRail />
      </Sidebar>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
    </>
  );
}

export function AppSidebar() {
  return (
    <AppSidebarProvider>
      <AppSidebarLayout />
    </AppSidebarProvider>
  );
}
