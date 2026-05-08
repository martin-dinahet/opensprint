"use client";

import { use } from "react";
import { ProjectKanbanPage } from "@/pages/project-kanban";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: Props) {
  const { id: projectId } = use(params);

  return <ProjectKanbanPage projectId={projectId} />;
}
