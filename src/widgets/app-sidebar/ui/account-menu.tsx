"use client";

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared";
import { collapsedTextClass, sidebarNavButtonClass, useAppSidebar } from "../lib";
import { UserAvatar } from "./user-avatar";

export function AccountMenu() {
  const { onNavigateAccount, signOut, signOutPending, user } = useAppSidebar();
  const { setOpen: setSidebarOpen, state: sidebarState } = useSidebar();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <SidebarFooter className="gap-1 border-sidebar-border border-t-2 px-2 py-[7px]">
      <Collapsible
        open={accountOpen}
        onOpenChange={(nextOpen) => setAccountOpen(sidebarState === "collapsed" ? true : nextOpen)}
        className="flex flex-col rounded-none border border-sidebar-border bg-sidebar group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
      >
        <CollapsibleContent className={`${collapsedTextClass} border-sidebar-border border-b p-1`}>
          <SidebarMenu className="gap-1 pb-1">
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
                <span>{signOutPending ? "Signing out…" : "Sign Out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </CollapsibleContent>

        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger
              onClick={() => {
                if (sidebarState === "collapsed") {
                  setSidebarOpen(true);
                }
              }}
              render={
                <SidebarMenuButton
                  size="lg"
                  tooltip="Account"
                  className="h-10 rounded-none px-2 hover:bg-sidebar-accent data-panel-open:bg-sidebar-accent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border"
                />
              }
            >
              <UserAvatar className="size-8 group-data-[collapsible=icon]:size-7" user={user} />
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
