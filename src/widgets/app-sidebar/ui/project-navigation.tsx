import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import {
  collapsedTextClass,
  sidebarNavButtonClass,
  sidebarSectionClass,
  sidebarSectionTriggerClass,
} from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";
import { getProjectNavigationItems } from "../lib/navigation";

export function ProjectNavigation() {
  const { activeProject, pathname, projectId } = useAppSidebar();
  const projectItems = getProjectNavigationItems(projectId);
  const [open, setOpen] = useState(true);
  const SectionIcon = open ? ChevronDownIcon : ChevronRightIcon;

  if (!projectId) {
    return null;
  }

  return (
    <SidebarGroup className={sidebarSectionClass}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={`group/section flex w-full items-center justify-between ${sidebarSectionTriggerClass}`}
        >
          <span className="truncate">{activeProject?.name ?? "Project"}</span>
          <SectionIcon aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {projectItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={
                        projectId
                          ? pathname === item.href ||
                            (item.href === `/projects/${projectId}` &&
                              pathname.startsWith(`/projects/${projectId}/boards/`))
                          : false
                      }
                      className={sidebarNavButtonClass}
                      render={<Link href={item.href} />}
                    >
                      <Icon />
                      <span className={collapsedTextClass}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
