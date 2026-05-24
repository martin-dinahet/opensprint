import { PanelsTopLeftIcon } from "lucide-react";
import Link from "next/link";
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared";
import { collapsedTextClass } from "../lib";

export function SidebarBrand() {
  return (
    <SidebarHeader className="gap-2 px-3 pt-3 pb-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip="OpenSprint"
            className="h-9 rounded-md bg-transparent px-2 text-sidebar-foreground hover:bg-sidebar-accent/45"
            render={<Link href="/dashboard" />}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <PanelsTopLeftIcon />
            </span>
            <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
              <span className="block truncate font-semibold text-sm">OpenSprint</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
