"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { BoardOutput } from "@/entities/board";
import { useBoards } from "@/entities/board";
import { useProjectMembers } from "@/entities/member";
import type { ProjectMemberRole } from "@/entities/member";
import type { ProjectListOutput } from "@/entities/project";
import { useProjects } from "@/entities/project";
import { useSignOut } from "@/features/auth";
import { authClient } from "@/shared/lib/auth-client";
import { getProjectId } from "./navigation";

type SidebarUser = {
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

type AppSidebarContextValue = {
  activeBoards: BoardOutput[];
  activeProject?: ProjectListOutput;
  currentProjectRole?: ProjectMemberRole;
  createProjectOpen: boolean;
  inviteMemberOpen: boolean;
  isBoardsLoading: boolean;
  isProjectsLoading: boolean;
  onNavigateAccount: () => void;
  openCreateProject: () => void;
  openInviteMember: () => void;
  pathname: string;
  projectId: string;
  projects: ProjectListOutput[];
  setCreateProjectOpen: (open: boolean) => void;
  setInviteMemberOpen: (open: boolean) => void;
  signOut: () => void;
  signOutPending: boolean;
  user?: SidebarUser | null;
};

const AppSidebarContext = createContext<AppSidebarContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function AppSidebarProvider({ children }: Props) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const session = authClient.useSession();
  const signOut = useSignOut();
  const { data: projects = [], isLoading } = useProjects();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const projectId = getProjectId(pathname, params);
  const activeProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);
  const { data: activeBoards = [], isLoading: isBoardsLoading } = useBoards(projectId);
  const { data: projectMembers = [] } = useProjectMembers(projectId);
  const currentProjectRole = projectMembers.find((member) => member.userId === session.data?.user.id)?.role;
  const openCreateProject = useCallback(() => setCreateProjectOpen(true), []);
  const openInviteMember = useCallback(() => setInviteMemberOpen(true), []);
  const onNavigateAccount = useCallback(() => router.push("/account"), [router]);

  const value = useMemo<AppSidebarContextValue>(
    () => ({
      activeBoards,
      activeProject,
      currentProjectRole,
      createProjectOpen,
      inviteMemberOpen,
      isBoardsLoading,
      isProjectsLoading: isLoading,
      onNavigateAccount,
      openCreateProject,
      openInviteMember,
      pathname,
      projectId,
      projects,
      setCreateProjectOpen,
      setInviteMemberOpen,
      signOut: signOut.action,
      signOutPending: signOut.pending,
      user: session.data?.user,
    }),
    [
      activeBoards,
      activeProject,
      currentProjectRole,
      createProjectOpen,
      inviteMemberOpen,
      isBoardsLoading,
      isLoading,
      onNavigateAccount,
      openCreateProject,
      openInviteMember,
      pathname,
      projectId,
      projects,
      session.data?.user,
      signOut.action,
      signOut.pending,
    ],
  );

  return <AppSidebarContext.Provider value={value}>{children}</AppSidebarContext.Provider>;
}

export function useAppSidebar() {
  const context = useContext(AppSidebarContext);
  if (!context) {
    throw new Error("useAppSidebar must be used within AppSidebarProvider");
  }

  return context;
}
