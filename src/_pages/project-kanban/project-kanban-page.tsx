"use client";

import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { CreateBoardDialog } from "@/features/create-board";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppHeader } from "@/widgets/app-header";
import { BoardColumn, Kanban, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  projectId: string;
};

export function ProjectKanbanPage({ projectId }: Props) {
  const session = authClient.useSession();

  if (!session.data?.user) return <LoadingScreen />;

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
      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader
          className="shrink-0"
          leading={
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Projects
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Kanban</span>
            </div>
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
