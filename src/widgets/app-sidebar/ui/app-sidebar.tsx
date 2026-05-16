"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail } from "@/shared/shadcn/sidebar";
import { AppSidebarProvider, useAppSidebar } from "../lib";
import { ProjectList } from "./project-list";

function AppSidebarLayout() {
  const { createProjectOpen, setCreateProjectOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarContent className="gap-1 px-1 py-2">
          <ProjectList />
        </SidebarContent>
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
