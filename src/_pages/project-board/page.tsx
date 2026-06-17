"use client";

import { ProjectKanbanProvider } from "@/widgets/kanban-board";
import { ProjectBoardScreen } from "@/widgets/project-board";

export function ProjectBoardPage({ boardId, projectId }: { boardId: string; projectId: string }) {
  return (
    <ProjectKanbanProvider boardId={boardId} projectId={projectId}>
      <ProjectBoardScreen />
    </ProjectKanbanProvider>
  );
}
