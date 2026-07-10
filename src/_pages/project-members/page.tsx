"use client";

import { ProjectMembersScreen } from "@/widgets/project-members";

export function ProjectMembersPage({ projectId }: { projectId: string }) {
  return <ProjectMembersScreen projectId={projectId} />;
}
