"use client";

import { useQueries } from "@tanstack/react-query";
import { IconPlus, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import type { BoardOutput } from "@/entities/board";
import { useProject } from "@/entities/project";
import { taskApi, taskKeys } from "@/entities/task/api";
import { CreateBoardDialog } from "@/features/create-board";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { TaskDetailDialog } from "@/features/view-task";
import { unwrapClientResult } from "@/shared/api/result";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";
import { BoardColumn, Kanban, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  projectId: string;
};

export const ProjectKanbanPage = ({ projectId }: Props) => {
  return (
    <ProjectKanbanProvider projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
};

const ProjectKanbanContent = () => {
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
    setViewTask,
    viewTask,
  } = useProjectKanban();
  const { data: project } = useProject(projectId);
  const totalTaskCount = useTotalTaskCount(boards ?? []);

  return (
    <Kanban.Root>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader
          title="Sprint Board"
          description={
            project ? (
              <span>
                {project.name} · Created{" "}
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.createdAt))} ·{" "}
                {totalTaskCount} {totalTaskCount === 1 ? "task" : "tasks"}
              </span>
            ) : null
          }
          eyebrow={
            <span className="flex items-center gap-2">
              <Link href="/dashboard" className="hover:text-foreground">
                Projects
              </Link>
              <span>/</span>
              <span>{project?.name ?? "Project"}</span>
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
              {boards?.map((board) => (
                <BoardColumn board={board} key={board.id} />
              ))}

              <Button
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
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

      <TaskDetailDialog
        members={members}
        onOpenChange={(open) => !open && setViewTask(null)}
        open={!!viewTask}
        task={viewTask}
      />
    </Kanban.Root>
  );
};

function useTotalTaskCount(boards: BoardOutput[]) {
  const taskQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: taskKeys.list(board.id),
      queryFn: async () => unwrapClientResult(await taskApi.list(board.id)).tasks,
      enabled: !!board.id,
    })),
  });

  return taskQueries.reduce((total, query) => total + (query.data?.length ?? 0), 0);
}
