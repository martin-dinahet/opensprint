"use client";

import { ChevronsUpDownIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared/ui/sidebar";
import { collapsedTextClass, sidebarNavButtonClass } from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";
import { ThemeToggleGroup } from "./theme-toggle-group";
import { UserAvatar } from "./user-avatar";

export function AccountMenu() {
  const { onNavigateAccount, signOut, signOutPending, user } = useAppSidebar();
  const [open, setOpen] = useState(false);

  return (
    <SidebarFooter className="gap-1 px-3 pt-2 pb-3">
      <Popover open={open} onOpenChange={setOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <PopoverTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  tooltip="Account"
                  className="h-11 rounded-md px-2 hover:bg-transparent hover:text-sidebar-foreground data-panel-open:bg-transparent"
                />
              }
            >
              <UserAvatar className="size-8" user={user} />
              <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
                <span className="block truncate font-medium text-sm">{user?.name || "Account"}</span>
                <span className="block truncate text-sidebar-foreground/55 text-xs">{user?.email}</span>
              </span>
              <ChevronsUpDownIcon className={collapsedTextClass} aria-hidden="true" />
            </PopoverTrigger>
          </SidebarMenuItem>
        </SidebarMenu>

        <PopoverContent side="right" align="end" sideOffset={10} className="w-64 gap-2 p-2">
          <div className="px-1 pb-2">
            <ThemeToggleGroup />
          </div>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Account settings"
                className={sidebarNavButtonClass}
                onClick={() => {
                  setOpen(false);
                  onNavigateAccount();
                }}
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
        </PopoverContent>
      </Popover>
    </SidebarFooter>
  );
}
