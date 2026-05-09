import { ChevronDownIcon, ChevronRightIcon, FolderKanbanIcon, ListPlusIcon } from "lucide-react";
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
} from "@/shared/ui/sidebar";
import {
  collapsedTextClass,
  projectListLimit,
  projectSkeletonKeys,
  sidebarNavButtonClass,
  sidebarSectionClass,
  sidebarSectionTriggerClass,
} from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";

export function ProjectList() {
  const { isProjectsLoading, openCreateProject, projectId, projects } = useAppSidebar();
  const [open, setOpen] = useState(true);
  const SectionIcon = open ? ChevronDownIcon : ChevronRightIcon;

  return (
    <SidebarGroup className={`${sidebarSectionClass} min-h-0 flex-1`}>
      <Collapsible open={open} onOpenChange={setOpen} className="flex min-h-0 flex-1 flex-col">
        <CollapsibleTrigger
          className={`group/section flex w-full items-center justify-between ${sidebarSectionTriggerClass}`}
        >
          Projects
          <SectionIcon aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="min-h-0 flex-1">
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SidebarMenu className="gap-1">
              {isProjectsLoading
                ? projectSkeletonKeys.map((key) => <SidebarMenuSkeleton key={key} showIcon />)
                : projects.length
                  ? projects.slice(0, projectListLimit).map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          tooltip={project.name}
                          isActive={project.id === projectId}
                          className={sidebarNavButtonClass}
                          render={<Link href={`/projects/${project.id}`} />}
                        >
                          <FolderKanbanIcon />
                          <span className={collapsedTextClass}>{project.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  : null}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Create project"
                  className={sidebarNavButtonClass}
                  onClick={openCreateProject}
                >
                  <ListPlusIcon />
                  <span className={collapsedTextClass}>Create project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
