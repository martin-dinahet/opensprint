import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared";
import {
  collapsedTextClass,
  getProjectNavigationItems,
  sidebarNavButtonClass,
  sidebarSectionClass,
  sidebarSectionLabelClass,
  sidebarSectionTriggerClass,
  useAppSidebar,
} from "../lib";

export function ProjectNavigation() {
  const { activeProject, boardId, pathname, projectId } = useAppSidebar();
  const projectItems = getProjectNavigationItems(projectId, boardId || activeProject?.defaultBoardId);
  const [open, setOpen] = useState(true);
  const SectionIcon = open ? ChevronDownIcon : ChevronRightIcon;

  if (!projectId) {
    return null;
  }

  return (
    <SidebarGroup className={`${sidebarSectionClass} mt-2 border-sidebar-border/90 border-t pt-3`}>
      <div className={sidebarSectionLabelClass}>Project</div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={`group/section flex w-full items-center justify-between ${sidebarSectionTriggerClass}`}
        >
          <span className="truncate">{activeProject?.name ?? "Project"}</span>
          <Icon icon={SectionIcon} className="size-3.5" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {projectItems.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={projectId ? pathname === item.href : false}
                      className={sidebarNavButtonClass}
                      render={<Link href={item.href} />}
                    >
                      <Icon icon={ItemIcon} />
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
