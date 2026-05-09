"use client";

import {
  FolderKanbanIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { authClient } from "@/shared/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
} from "@/shared/ui/sidebar";
import { ThemeMenuItems } from "./theme-menu";
import { UserAvatar } from "./user-avatar";

const collapsedTextClass = "group-data-[collapsible=icon]:hidden";

function getProjectId(pathname: string, params: ReturnType<typeof useParams>) {
  const paramId = params.id;
  if (typeof paramId === "string") return paramId;
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? "";
}

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const session = authClient.useSession();
  const signOut = useSignOut();
  const { data: projects = [], isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const projectId = getProjectId(pathname, params);
  const activeProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);

  const projectItems = [
    { href: projectId ? `/projects/${projectId}` : "/dashboard", label: "Board", icon: KanbanSquareIcon },
    { href: projectId ? `/projects/${projectId}/members` : "/dashboard", label: "Members", icon: UsersIcon },
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="OpenSprint" render={<Link href="/dashboard" />}>
                <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <FolderKanbanIcon className="size-4" />
                </span>
                <span className={`truncate font-semibold ${collapsedTextClass}`}>OpenSprint</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Projects"
                    isActive={pathname === "/dashboard"}
                    render={<Link href="/dashboard" />}
                  >
                    <LayoutDashboardIcon />
                    <span className={collapsedTextClass}>Projects</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Account"
                    isActive={pathname === "/account"}
                    render={<Link href="/account" />}
                  >
                    <SettingsIcon />
                    <span className={collapsedTextClass}>Account</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {projectId && (
            <SidebarGroup>
              <SidebarGroupLabel>{activeProject?.name ?? "Project"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={pathname === item.href}
                          render={<Link href={item.href} />}
                        >
                          <Icon />
                          <span className={collapsedTextClass}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Create project" onClick={() => setCreateOpen(true)}>
              <PlusIcon />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                  </>
                ) : projects.length ? (
                  projects.slice(0, 8).map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        tooltip={project.name}
                        isActive={project.id === projectId}
                        render={<Link href={`/projects/${project.id}`} />}
                      >
                        <FolderKanbanIcon />
                        <span className={collapsedTextClass}>{project.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="New project" onClick={() => setCreateOpen(true)}>
                      <PlusIcon />
                      <span className={collapsedTextClass}>New project</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" tooltip="Account" />}>
                  <UserAvatar user={session.data?.user} />
                  <span className={`min-w-0 flex-1 ${collapsedTextClass}`}>
                    <span className="block truncate font-medium">{session.data?.user.name || "Account"}</span>
                    <span className="block truncate text-muted-foreground text-xs">{session.data?.user.email}</span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <UserAvatar user={session.data?.user} />
                      <span className="min-w-0">
                        <span className="block truncate text-foreground">{session.data?.user.name || "Account"}</span>
                        <span className="block truncate font-normal text-muted-foreground">
                          {session.data?.user.email}
                        </span>
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => location.assign("/account")}>
                    <SettingsIcon />
                    Account
                  </DropdownMenuItem>
                  <ThemeMenuItems />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut.action} disabled={signOut.pending}>
                    <LogOutIcon />
                    {signOut.pending ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
