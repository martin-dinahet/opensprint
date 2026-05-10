"use client";

import { CreateProjectDialog } from "@/features/create-project";
import { Sidebar, SidebarContent, SidebarRail, SidebarSeparator } from "@/shared/ui/sidebar";
import { AppSidebarProvider, useAppSidebar } from "../lib/app-sidebar-context";
import { AccountMenu } from "./account-menu";
import { ProjectNavigation } from "./project-navigation";
import { ProjectInviteDialog } from "./project-invite-dialog";
import { SidebarBrand } from "./sidebar-brand";
import { WorkspaceNavigation } from "./workspace-navigation";

function AppSidebarLayout() {
  const { createProjectOpen, inviteMemberOpen, projectId, setCreateProjectOpen, setInviteMemberOpen } = useAppSidebar();

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarBrand />
        <SidebarContent className="gap-2 px-1 pb-2">
          <WorkspaceNavigation />
          {projectId && (
            <SidebarSeparator className="mx-auto mt-5 mb-4 w-40 max-w-[76%] group-data-[collapsible=icon]:w-7" />
          )}
          <ProjectNavigation />
        </SidebarContent>
        <AccountMenu />
        <SidebarRail />
      </Sidebar>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
      <ProjectInviteDialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen} />
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
