"use client";

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared/ui/sidebar";
import { collapsedTextClass, sidebarNavButtonClass } from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";
import { UserAvatar } from "./user-avatar";

export function AccountMenu() {
  const { onNavigateAccount, signOut, signOutPending, user } = useAppSidebar();
  const [open, setOpen] = useState(false);

  return (
    <SidebarFooter className="gap-1 px-3 pt-2 pb-3">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="flex flex-col rounded-md bg-sidebar-accent/35 p-1 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
      >
        <CollapsibleContent className={collapsedTextClass}>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Account settings"
                className={sidebarNavButtonClass}
                onClick={onNavigateAccount}
              >
                <SettingsIcon />
                <span>Account settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                className={sidebarNavButtonClass}
                onClick={signOut}
                disabled={signOutPending}
              >
                <LogOutIcon />
                <span>{signOutPending ? "Signing out..." : "Sign out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </CollapsibleContent>

        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  tooltip="Account"
                  className="h-11 rounded-md px-2 hover:bg-sidebar-accent/60 data-panel-open:bg-transparent"
                />
              }
            >
              <UserAvatar className="size-8" user={user} />
              <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
                <span className="block truncate font-medium text-sm">{user?.name || "Account"}</span>
                <span className="block truncate text-sidebar-foreground/55 text-xs">{user?.email}</span>
              </span>
              <ChevronsUpDownIcon className={collapsedTextClass} aria-hidden="true" />
            </CollapsibleTrigger>
          </SidebarMenuItem>
        </SidebarMenu>
      </Collapsible>
    </SidebarFooter>
  );
}
