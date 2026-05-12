import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/shared/shadcn/icon";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/shadcn/sidebar";
import { useAppSidebar } from "../lib/app-sidebar-context";
import { collapsedTextClass, sidebarNavButtonClass, sidebarSectionClass } from "../lib/constants";

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
