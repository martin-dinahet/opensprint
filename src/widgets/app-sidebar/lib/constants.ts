import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

export const collapsedTextClass = "group-data-[collapsible=icon]:hidden";

export const sidebarNavButtonClass =
  "h-8 rounded-none border border-transparent px-2 font-medium text-sidebar-foreground/75 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:border-sidebar-border data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto";

export const sidebarSubNavButtonClass =
  "h-7 rounded-none border border-transparent px-2 text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:border-sidebar-border data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground";

export const sidebarSectionClass = "px-0 py-0 group-data-[collapsible=icon]:px-0";

export const sidebarSectionTriggerClass =
  "h-8 rounded-none border border-sidebar-border bg-sidebar px-2 font-black text-[0.68rem] text-sidebar-foreground uppercase hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden";

export const sidebarSectionLabelClass =
  "px-2 pb-1 font-black text-[0.68rem] text-sidebar-foreground/55 uppercase group-data-[collapsible=icon]:hidden";

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
