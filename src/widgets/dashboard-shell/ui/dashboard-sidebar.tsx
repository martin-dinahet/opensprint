"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderKanbanIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import type { ProjectListOutput } from "@/entities/project";
import { useProjects } from "@/entities/project";
import { useSignOut } from "@/features/auth";
import { CreateProjectDialog } from "@/features/create-project";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  authClient,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared";

const collapsedTextClass = "group-data-[collapsible=icon]:hidden";
const navButtonClass =
  "h-9 rounded-md border-l-[3px] border-l-transparent px-2.5 font-normal text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground data-active:border-l-primary data-active:bg-sidebar-accent/95 data-active:font-medium data-active:text-sidebar-accent-foreground";
const themeItems = [
  { label: "Light", value: "light", icon: SunIcon },
  { label: "Dark", value: "dark", icon: MoonIcon },
  { label: "System", value: "system", icon: MonitorIcon },
] as const;

type RouteParams = Readonly<Record<string, string | string[] | undefined>>;

export function DashboardSidebar() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <DashboardSidebarHeader onCreateProject={() => setCreateProjectOpen(true)} />
        <SidebarContent className="gap-1 px-1 py-2">
          <WorkspaceSection />
          <CurrentProjectSection />
          <ProjectListSection />
        </SidebarContent>
        <DashboardSidebarFooter />
        <SidebarRail />
      </Sidebar>

      <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
    </>
  );
}

function DashboardSidebarHeader({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <SidebarHeader className="px-3 pt-3 pb-3">
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
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="New project" className={navButtonClass} onClick={onCreateProject}>
            <PlusIcon />
            <span className={collapsedTextClass}>New project</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

function WorkspaceSection() {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-2">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="All projects"
              isActive={pathname === "/dashboard"}
              className={navButtonClass}
              render={<Link href="/dashboard" />}
            >
              <LayoutDashboardIcon />
              <span className={collapsedTextClass}>All projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CurrentProjectSection() {
  const pathname = usePathname();
  const params = useParams();
  const { data: projects = [] } = useProjects();
  const projectId = getProjectId(pathname, params);
  const boardId = getBoardId(pathname, params);
  const activeProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);

  if (!projectId) return null;

  const boardHref =
    boardId || activeProject?.defaultBoardId
      ? `/projects/${projectId}/boards/${boardId || activeProject?.defaultBoardId}`
      : `/projects/${projectId}`;
  const links = [
    { href: boardHref, label: "Project", icon: KanbanSquareIcon },
    { href: `/projects/${projectId}/members`, label: "Members", icon: UsersIcon },
  ];

  return (
    <SidebarGroup className="mt-2 border-sidebar-border/90 border-t px-2 pt-3 pb-1 group-data-[collapsible=icon]:px-2">
      <SidebarGroupLabel>{activeProject?.name ?? "Project"}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {links.map((item) => {
            const ItemIcon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={pathname === item.href}
                  className={navButtonClass}
                  render={<Link href={item.href} />}
                >
                  <ItemIcon />
                  <span className={collapsedTextClass}>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ProjectListSection() {
  const pathname = usePathname();
  const params = useParams();
  const { data: projects = [], isLoading } = useProjects();
  const projectId = getProjectId(pathname, params);
  const [open, setOpen] = useState(true);
  const SectionIcon = open ? ChevronDownIcon : ChevronRightIcon;

  return (
    <SidebarGroup className="min-h-0 flex-1 px-2 py-1 group-data-[collapsible=icon]:px-2">
      <Collapsible open={open} onOpenChange={setOpen} className="flex min-h-0 flex-1 flex-col">
        <CollapsibleTrigger className="flex h-8 w-full items-center justify-between rounded-md px-2 text-sidebar-foreground/64 text-xs font-medium hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          Projects
          <SectionIcon className="size-3.5" />
        </CollapsibleTrigger>
        <CollapsibleContent className="min-h-0 flex-1">
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SidebarMenu className="gap-1 pl-2 group-data-[collapsible=icon]:pl-0">
              {isLoading
                ? ["project-1", "project-2", "project-3", "project-4"].map((key) => (
                    <SidebarMenuSkeleton key={key} showIcon />
                  ))
                : projects
                    .slice(0, 10)
                    .map((project) => (
                      <ProjectListItem key={project.id} project={project} activeProjectId={projectId} />
                    ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

function ProjectListItem({ activeProjectId, project }: { activeProjectId: string; project: ProjectListOutput }) {
  const href = project.defaultBoardId
    ? `/projects/${project.id}/boards/${project.defaultBoardId}`
    : `/projects/${project.id}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={project.name}
        isActive={project.id === activeProjectId}
        className={navButtonClass}
        render={<Link href={href} />}
      >
        <FolderKanbanIcon />
        <span className={collapsedTextClass}>{project.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DashboardSidebarFooter() {
  const router = useRouter();
  const session = authClient.useSession();
  const signOut = useSignOut();
  const user = session.data?.user;

  return (
    <SidebarFooter className="gap-2 px-3 pt-2 pb-3">
      <ThemePicker />
      <SidebarSeparator className={collapsedTextClass} />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Account settings"
            className={navButtonClass}
            onClick={() => router.push("/account")}
          >
            <SettingsIcon />
            <span className={collapsedTextClass}>Account settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Sign out"
            className={navButtonClass}
            onClick={signOut.action}
            disabled={signOut.pending}
          >
            <LogOutIcon />
            <span className={collapsedTextClass}>{signOut.pending ? "Signing out…" : "Sign Out"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="Account" className="h-11 rounded-md px-2 hover:bg-sidebar-accent/60">
            <Avatar className="size-8">
              {user?.image ? <AvatarImage src={user.image} alt={user.name || user.email || "User"} /> : null}
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
            <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
              <span className="block truncate font-medium text-sm">{user?.name || "Account"}</span>
              <span className="block truncate text-sidebar-foreground/55 text-xs">{user?.email}</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function ThemePicker() {
  const { setTheme, theme = "system" } = useTheme();

  return (
    <div className={`flex flex-col gap-2 ${collapsedTextClass}`}>
      <div className="flex items-center gap-2 px-1 text-sidebar-foreground/60 text-xs">
        <PaletteIcon className="size-3.5" />
        <span>Theme</span>
      </div>
      <ToggleGroup
        value={[theme]}
        onValueChange={(value) => {
          const nextTheme = value[0];
          if (nextTheme) setTheme(nextTheme);
        }}
        variant="outline"
        size="sm"
        className="grid w-full grid-cols-3 rounded-md bg-sidebar-accent/35 p-0.5"
      >
        {themeItems.map((item) => {
          const ThemeIcon = item.icon;

          return (
            <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label} className="rounded-sm">
              <span className="sr-only">{item.label}</span>
              <ThemeIcon />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}

function getProjectId(pathname: string, params: RouteParams) {
  const paramId = params.id;
  if (typeof paramId === "string") return paramId;

  return pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "";
}

function getBoardId(pathname: string, params: RouteParams) {
  const paramId = params.boardId;
  if (typeof paramId === "string") return paramId;

  return pathname.match(/^\/projects\/[^/]+\/boards\/([^/]+)/)?.[1] ?? "";
}

function getInitials(user?: { email?: string | null; name?: string | null } | null) {
  const source = user?.name || user?.email || "User";
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
