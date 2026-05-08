"use client";

import { use } from "react";
import { ProjectKanbanPage } from "@/features/project/components/project-kanban-page";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: Props) {
  const { id: projectId } = use(params);

  return <ProjectKanbanPage projectId={projectId} />;
}
