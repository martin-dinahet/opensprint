import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

export const collapsedTextClass = "group-data-[collapsible=icon]:hidden";

export const sidebarNavButtonClass =
  "h-9 rounded-md px-2.5 font-normal text-sidebar-foreground/72 hover:bg-transparent hover:text-sidebar-foreground focus-visible:ring-2 active:bg-transparent active:text-sidebar-foreground data-active:bg-transparent data-active:font-semibold data-active:text-sidebar-foreground disabled:text-sidebar-foreground/36";

export const sidebarSubNavButtonClass =
  "h-7 rounded-md px-2 font-normal text-sidebar-foreground/64 hover:bg-transparent hover:text-sidebar-foreground focus-visible:ring-2 active:bg-transparent active:text-sidebar-foreground data-active:bg-transparent data-active:font-semibold data-active:text-sidebar-foreground disabled:text-sidebar-foreground/36";

export const sidebarSectionClass = "px-2 py-1 group-data-[collapsible=icon]:px-2";

export const sidebarSectionTriggerClass =
  "h-8 px-2 text-sidebar-foreground/64 text-xs font-medium hover:bg-transparent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden";

export const projectListLimit = 10;

export const projectSkeletonKeys = [
  "project-skeleton-1",
  "project-skeleton-2",
  "project-skeleton-3",
  "project-skeleton-4",
  "project-skeleton-5",
];

export const themeItems = [
  { label: "Light", value: "light", icon: SunIcon },
  { label: "Dark", value: "dark", icon: MoonIcon },
  { label: "System", value: "system", icon: MonitorIcon },
] as const;
