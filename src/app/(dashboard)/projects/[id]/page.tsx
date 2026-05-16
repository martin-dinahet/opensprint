"use client";

import { IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import type { ColumnOutput } from "@/entities/column";
import { useProject } from "@/entities/project";
import { taskApi, taskKeys } from "@/entities/task";
import { CreateColumnDialog } from "@/features/create-column";
import { CreateTaskDialog } from "@/features/create-task";
import { EditTaskDialog } from "@/features/edit-task";
import { TaskDetailDialog } from "@/features/view-task";
import { unwrapClientResult } from "@/shared/api/result";
import { Button } from "@/shared/shadcn/button";
import { LoadingScreen } from "@/shared/shadcn/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";
import { Kanban, KanbanColumn, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: Props) {
  const { id: projectId } = use(params);

  return (
    <ProjectKanbanProvider projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
}

const ProjectKanbanContent = () => {
  const {
    activeColumnId,
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
  const totalTaskCount = useTotalTaskCount(columns);

  return (
    <Kanban.Root>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader
          title={project?.name ?? "Project"}
          description={
            project ? (
              <span>
                Created{" "}
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

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isLoading ? (
            <LoadingScreen label="Loading project..." variant="shell" />
          ) : (
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <Kanban.Columns>
                {columns.map((column) => (
                  <KanbanColumn column={column} key={column.id} />
                ))}

                <Button
                  className="h-12 w-72 shrink-0 border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  onClick={openCreateColumn}
                  variant="ghost"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add column
                </Button>
              </Kanban.Columns>
            </div>
          )}
        </main>
      </div>

      <CreateColumnDialog onOpenChange={setCreateColumnOpen} open={createColumnOpen} projectId={projectId} />

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

function useTotalTaskCount(columns: ColumnOutput[]) {
  const taskQueries = useQueries({
    queries: columns.map((column) => ({
      queryKey: taskKeys.list(column.id),
      queryFn: async () => unwrapClientResult(await taskApi.list(column.id)).tasks,
      enabled: !!column.id,
    })),
  });

  return taskQueries.reduce((total, query) => total + (query.data?.length ?? 0), 0);
}
