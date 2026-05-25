import { PanelsTopLeftIcon } from "lucide-react";
import Link from "next/link";
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared";
import { collapsedTextClass } from "../lib";

export function SidebarBrand() {
  return (
    <SidebarHeader className="border-sidebar-border border-b-2 px-2 py-[7px]">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            tooltip="OpenSprint"
            className="h-10 rounded-none border border-sidebar-border bg-sidebar px-2 text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center"
            render={<Link href="/dashboard" />}
          >
            <span className="flex size-7 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
              <PanelsTopLeftIcon />
            </span>
            <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
              <span className="block truncate font-black text-sm uppercase">OpenSprint</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
