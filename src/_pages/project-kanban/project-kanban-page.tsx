"use client";

import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { CreateBoardDialog } from "@/features/create-board";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";
import { BoardColumn, Kanban, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  projectId: string;
};

export function ProjectKanbanPage({ projectId }: Props) {
  return (
    <ProjectKanbanProvider projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
}

function ProjectKanbanContent() {
  const {
    activeBoardId,
    boards,
    createBoardOpen,
    createTaskOpen,
    editTask,
    isLoading,
    members,
    openCreateBoard,
    projectId,
    setCreateBoardOpen,
    setCreateTaskOpen,
    setEditTask,
  } = useProjectKanban();

  return (
    <Kanban.Root>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader
          title="Board"
          eyebrow={
            <span className="flex items-center gap-2">
              <Link href="/dashboard" className="hover:text-foreground">
                Projects
              </Link>
              <span>/</span>
              <span>Kanban</span>
            </span>
          }
          actions={
            <Link
              href={`/projects/${projectId}/members`}
              className="text-muted-foreground text-sm hover:text-foreground"
            >
              Members
            </Link>
          }
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <Kanban.Columns>
              {boards?.map((board) => (
                <BoardColumn board={board} key={board.id} />
              ))}

              <Button
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border hover:border-solid"
                onClick={openCreateBoard}
                variant="ghost"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </Kanban.Columns>
          )}
        </main>
      </div>

      <CreateBoardDialog onOpenChange={setCreateBoardOpen} open={createBoardOpen} projectId={projectId} />

      <CreateTaskDialog
        boardId={activeBoardId}
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
    </Kanban.Root>
  );
}
