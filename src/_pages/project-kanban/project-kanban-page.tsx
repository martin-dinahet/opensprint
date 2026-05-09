"use client";

import { IconPlus, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import { useBoards } from "@/entities/board";
import { useProject } from "@/entities/project";
import { CreateColumnDialog } from "@/features/create-column";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { TaskDetailDialog } from "@/features/view-task";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";
import { BoardColumn, Kanban, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  boardId?: string;
  projectId: string;
};

export const ProjectKanbanPage = ({ boardId, projectId }: Props) => {
  const { data: boards = [], isLoading } = useBoards(projectId);
  const activeBoardId = boardId ?? boards[0]?.id ?? "";

  if (isLoading && !activeBoardId) {
    return <LoadingScreen label="Loading board..." variant="shell" />;
  }

  return (
    <ProjectKanbanProvider boardId={activeBoardId} projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
};

const ProjectKanbanContent = () => {
  const {
    activeColumnId,
    boardId,
    columns,
    createColumnOpen,
    createTaskOpen,
    editTask,
    isLoading,
    members,
    openCreateColumn,
    projectId,
    setCreateColumnOpen,
    setCreateTaskOpen,
    setEditTask,
    setViewTask,
    viewTask,
  } = useProjectKanban();
  const { data: project } = useProject(projectId);

  return (
    <Kanban.Root>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader
          title={project?.name ?? "Board"}
          eyebrow={
            <span className="flex items-center gap-2">
              <Link href="/dashboard" className="hover:text-foreground">
                Projects
              </Link>
              <span>/</span>
              <span>Board</span>
            </span>
          }
          actions={
            <Link
              href={`/projects/${projectId}/members`}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-muted-foreground text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <IconUsersGroup className="h-3.5 w-3.5" />
              Members
            </Link>
          }
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <LoadingScreen label="Loading board..." variant="shell" />
          ) : (
            <Kanban.Columns>
              {columns?.map((column) => (
                <BoardColumn column={column} key={column.id} />
              ))}

              <Button
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border hover:border-solid"
                onClick={openCreateColumn}
                variant="ghost"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </Kanban.Columns>
          )}
        </main>
      </div>

      <CreateColumnDialog boardId={boardId} onOpenChange={setCreateColumnOpen} open={createColumnOpen} />

      <CreateTaskDialog
        columnId={activeColumnId}
        members={members}
        onOpenChange={setCreateTaskOpen}
        open={createTaskOpen}
      />

      <EditTaskDialog
        members={members}
        onOpenChange={(open) => !open && setEditTask(null)}
        open={!!editTask}
        task={editTask}
      />

      <TaskDetailDialog
        members={members}
        onOpenChange={(open) => !open && setViewTask(null)}
        open={!!viewTask}
        task={viewTask}
      />
    </Kanban.Root>
  );
};
