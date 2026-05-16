import { FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared/shadcn/sidebar";
import { collapsedTextClass } from "../lib";

export function SidebarBrand() {
  return (
    <SidebarHeader className="px-3 pt-3 pb-4">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip="OpenSprint"
            className="h-10 rounded-md bg-transparent px-2 text-sidebar-foreground hover:bg-sidebar-accent/45"
            render={<Link href="/dashboard" />}
          >
            <span className="flex size-7 items-center justify-center rounded-md text-sidebar-primary">
              <FolderKanbanIcon />
            </span>
            <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
              <span className="block truncate font-medium text-sm">OpenSprint</span>
              <span className="block truncate text-sidebar-foreground/55 text-xs leading-tight">Workspace</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
