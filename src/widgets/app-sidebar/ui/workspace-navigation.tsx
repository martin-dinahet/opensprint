import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { Icon, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared";
import { collapsedTextClass, sidebarNavButtonClass, sidebarSectionClass, useAppSidebar } from "../lib";

export function WorkspaceNavigation() {
  const { pathname } = useAppSidebar();

  return (
    <SidebarGroup className={sidebarSectionClass}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Projects"
              isActive={pathname === "/dashboard"}
              className={sidebarNavButtonClass}
              render={<Link href="/dashboard" />}
            >
              <Icon icon={InboxIcon} />
              <span className={collapsedTextClass}>Projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
