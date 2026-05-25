"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail } from "@/shared";
import { AppSidebarProvider, useAppSidebar } from "../lib";
import { AccountMenu } from "./account-menu";
import { ProjectList } from "./project-list";
import { SidebarBrand } from "./sidebar-brand";

function AppSidebarLayout() {
  const { createProjectOpen, setCreateProjectOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r-2">
        <SidebarBrand />
        <SidebarContent className="gap-2 px-2 py-2">
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
