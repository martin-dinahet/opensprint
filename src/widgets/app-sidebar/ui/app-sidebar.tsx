"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail } from "@/shared";
import { AppSidebarProvider, useAppSidebar } from "../lib";
import { AccountMenu } from "./account-menu";
import { ProjectList } from "./project-list";
import { SidebarBrand } from "./sidebar-brand";
import { WorkspaceNavigation } from "./workspace-navigation";

function AppSidebarLayout() {
  const { createProjectOpen, setCreateProjectOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarBrand />
        <SidebarContent className="gap-1 px-1 py-2">
          <WorkspaceNavigation />
          <ProjectList />
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
