import {
  ChevronDownIcon,
  ChevronRightIcon,
  Columns3Icon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  SquareKanbanIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/ui/sidebar";
import {
  collapsedTextClass,
  sidebarNavButtonClass,
  sidebarSectionClass,
  sidebarSubNavButtonClass,
} from "../lib/constants";
import { useAppSidebar } from "../lib/app-sidebar-context";

const projectNameClass =
  "h-10 px-2.5 py-1.5 text-sidebar-foreground/90 hover:bg-transparent data-active:bg-transparent";

export function ProjectNavigation() {
  const { activeBoards, activeProject, currentProjectRole, isBoardsLoading, openInviteMember, pathname, projectId } =
    useAppSidebar();
  const projectName = activeProject?.name ?? "Project";
  const [boardsOpen, setBoardsOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const BoardsChevron = boardsOpen ? ChevronDownIcon : ChevronRightIcon;
  const MembersChevron = membersOpen ? ChevronDownIcon : ChevronRightIcon;
  const canManageMembers = currentProjectRole === "owner" || currentProjectRole === "admin";

  if (!projectId) {
    return null;
  }

  return (
    <SidebarGroup className={`${sidebarSectionClass} py-1.5`}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={projectName}
              aria-label={`Current project ${projectName}`}
              className={`${sidebarNavButtonClass} ${projectNameClass}`}
              render={<Link href={`/projects/${projectId}`} />}
            >
              <FolderKanbanIcon />
              <span className={`${collapsedTextClass} truncate font-semibold text-base text-sidebar-foreground`}>
                {projectName}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Overview"
              isActive={pathname === `/projects/${projectId}`}
              render={<Link href={`/projects/${projectId}`} />}
              className={sidebarNavButtonClass}
            >
              <LayoutDashboardIcon />
              <span className={collapsedTextClass}>Overview</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Collapsible open={boardsOpen} onOpenChange={setBoardsOpen}>
              <CollapsibleTrigger render={<SidebarMenuButton tooltip="Boards" className={sidebarNavButtonClass} />}>
                <Columns3Icon />
                <span className={collapsedTextClass}>Boards</span>
                <BoardsChevron className={`ml-auto ${collapsedTextClass}`} aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mt-0.5">
                  {isBoardsLoading ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuSubItem>
                  ) : (
                    activeBoards.map((board) => (
                      <SidebarMenuSubItem key={board.id}>
                        <SidebarMenuSubButton
                          isActive={pathname === `/projects/${projectId}/boards/${board.id}`}
                          render={<Link href={`/projects/${projectId}/boards/${board.id}`} />}
                          className={sidebarSubNavButtonClass}
                        >
                          <SquareKanbanIcon />
                          <span>{board.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
              <CollapsibleTrigger render={<SidebarMenuButton tooltip="Members" className={sidebarNavButtonClass} />}>
                <UsersIcon />
                <span className={collapsedTextClass}>Members</span>
                <MembersChevron className={`ml-auto ${collapsedTextClass}`} aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mt-0.5">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<button type="button" onClick={openInviteMember} disabled={!canManageMembers} />}
                      className={sidebarSubNavButtonClass}
                    >
                      <UserPlusIcon />
                      <span>Invite member</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === `/projects/${projectId}/members`}
                      render={<Link href={`/projects/${projectId}/members`} />}
                      className={sidebarSubNavButtonClass}
                    >
                      <Settings2Icon />
                      <span>Manage</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
