"use client";

import { use } from "react";
import { ProjectKanbanPage } from "@/pages/project-kanban";

type Props = {
  params: Promise<{ boardId: string; id: string }>;
};

export default function ProjectBoardPage({ params }: Props) {
  const { boardId, id: projectId } = use(params);

  return <ProjectKanbanPage boardId={boardId} projectId={projectId} />;
}
