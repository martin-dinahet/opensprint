import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  HomeIcon,
  ListPlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/ui/sidebar";
import {
  collapsedTextClass,
  projectListLimit,
  projectSkeletonKeys,
  sidebarNavButtonClass,
  sidebarSectionClass,
  sidebarSubNavButtonClass,
} from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";

export function WorkspaceNavigation() {
  const { isProjectsLoading, openCreateProject, pathname, projectId, projects } = useAppSidebar();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const SettingsChevron = settingsOpen ? ChevronDownIcon : ChevronRightIcon;
  const ProjectsChevron = projectsOpen ? ChevronDownIcon : ChevronRightIcon;

  return (
    <SidebarGroup className={sidebarSectionClass}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Home"
              isActive={pathname === "/dashboard"}
              className={sidebarNavButtonClass}
              render={<Link href="/dashboard" />}
            >
              <HomeIcon />
              <span className={collapsedTextClass}>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger render={<SidebarMenuButton tooltip="Settings" className={sidebarNavButtonClass} />}>
                <SettingsIcon />
                <span className={collapsedTextClass}>Settings</span>
                <SettingsChevron className={`ml-auto ${collapsedTextClass}`} aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<button type="button" disabled />}
                      className={sidebarSubNavButtonClass}
                    >
                      <SlidersHorizontalIcon />
                      <span>General</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/account"}
                      render={<Link href="/account" />}
                      className={sidebarSubNavButtonClass}
                    >
                      <UserCircleIcon />
                      <span>Account</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
              <CollapsibleTrigger render={<SidebarMenuButton tooltip="Projects" className={sidebarNavButtonClass} />}>
                <FolderIcon />
                <span className={collapsedTextClass}>Projects</span>
                <ProjectsChevron className={`ml-auto ${collapsedTextClass}`} aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {isProjectsLoading
                    ? projectSkeletonKeys.map((key) => (
                        <SidebarMenuSubItem key={key}>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuSubItem>
                      ))
                    : projects.slice(0, projectListLimit).map((project) => (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton
                            isActive={project.id === projectId}
                            render={<Link href={`/projects/${project.id}`} />}
                            className={sidebarSubNavButtonClass}
                          >
                            <FolderIcon />
                            <span>{project.name}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<button type="button" onClick={openCreateProject} />}
                      className={sidebarSubNavButtonClass}
                    >
                      <ListPlusIcon />
                      <span>New project</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
