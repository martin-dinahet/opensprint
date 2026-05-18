"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail } from "@/shared";
import { AppSidebarProvider, useAppSidebar } from "../lib";
import { AccountMenu } from "./account-menu";
import { ProjectList } from "./project-list";

function AppSidebarLayout() {
  const { createProjectOpen, setCreateProjectOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarContent className="gap-1 px-1 py-2">
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
