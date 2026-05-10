import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { Icon } from "@/shared/ui/icon";
import { collapsedTextClass, sidebarNavButtonClass, sidebarSectionClass } from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";

export function WorkspaceNavigation() {
  const { pathname } = useAppSidebar();

  return (
    <SidebarGroup className={sidebarSectionClass}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="All projects"
              isActive={pathname === "/dashboard"}
              className={sidebarNavButtonClass}
              render={<Link href="/dashboard" />}
            >
              <Icon icon={LayoutDashboardIcon} />
              <span className={collapsedTextClass}>All projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
