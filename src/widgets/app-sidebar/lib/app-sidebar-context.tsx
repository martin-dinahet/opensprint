"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
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
  activeProject?: ProjectListOutput;
  createProjectOpen: boolean;
  isProjectsLoading: boolean;
  onNavigateAccount: () => void;
  openCreateProject: () => void;
  pathname: string;
  projectId: string;
  projects: ProjectListOutput[];
  setCreateProjectOpen: (open: boolean) => void;
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
  const projectId = getProjectId(pathname, params);
  const activeProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);
  const openCreateProject = useCallback(() => setCreateProjectOpen(true), []);
  const onNavigateAccount = useCallback(() => router.push("/account"), [router]);

  const value = useMemo<AppSidebarContextValue>(
    () => ({
      activeProject,
      createProjectOpen,
      isProjectsLoading: isLoading,
      onNavigateAccount,
      openCreateProject,
      pathname,
      projectId,
      projects,
      setCreateProjectOpen,
      signOut: signOut.action,
      signOutPending: signOut.pending,
      user: session.data?.user,
    }),
    [
      activeProject,
      createProjectOpen,
      isLoading,
      onNavigateAccount,
      openCreateProject,
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
