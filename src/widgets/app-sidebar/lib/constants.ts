import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

export const collapsedTextClass = "group-data-[collapsible=icon]:hidden";

export const sidebarNavButtonClass =
  "h-9 rounded-md border-l-[3px] border-l-transparent px-2.5 font-normal text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground data-active:border-l-primary data-active:bg-sidebar-accent/95 data-active:font-medium data-active:text-sidebar-accent-foreground";

export const sidebarSubNavButtonClass =
  "h-7 rounded-md px-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground";

export const sidebarSectionClass = "px-2 py-1 group-data-[collapsible=icon]:px-2";

export const sidebarSectionTriggerClass =
  "h-8 px-2 text-sidebar-foreground/64 text-xs font-medium hover:bg-transparent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden";

export const sidebarSectionLabelClass =
  "px-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden";

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
