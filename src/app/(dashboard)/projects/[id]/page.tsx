"use client";

import { IconPlus } from "@tabler/icons-react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { use, useMemo } from "react";
import type { ColumnOutput } from "@/entities/column";
import { useProject } from "@/entities/project";
import { taskApi, taskKeys } from "@/entities/task";
import { CreateColumnDialog } from "@/features/create-column";
import { TaskSheet } from "@/features/manage-task";
import { ProjectTabs } from "@/features/project-tabs";
import { unwrapClientResult } from "@/shared/api/result";
import { Button } from "@/shared/shadcn/button";
import { LoadingScreen } from "@/shared/shadcn/loading-screen";
import { useDashboardHeader } from "@/widgets/header";
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
    isLoading,
    members,
    openCreateColumn,
    projectId,
    selectedTask,
    setCreateColumnOpen,
    setCreateTaskOpen,
    setSelectedTask,
  } = useProjectKanban();
  const { data: project } = useProject(projectId);
  const taskLists = useProjectTaskLists(columns);
  const currentSelectedTask = taskLists.flat().find((task) => task.id === selectedTask?.id) ?? selectedTask;
  const header = useMemo(
    () => ({
      eyebrow: (
        <span className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Projects
          </Link>
          <span>/</span>
          <span className="truncate">{project?.name ?? "Project"}</span>
          <span>/</span>
          <span className="text-foreground">Board</span>
        </span>
      ),
      actions: <ProjectTabs activeTab="board" projectId={projectId} />,
    }),
    [project, projectId],
  );

  useDashboardHeader(header);

  return (
    <Kanban.Root>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <LoadingScreen label="Loading project..." variant="shell" />
        ) : (
          <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
            <Kanban.Columns>
              {columns.map((column) => (
                <KanbanColumn column={column} key={column.id} />
              ))}

              <Button
                className="h-12 w-96 shrink-0 border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
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

      <CreateColumnDialog onOpenChange={setCreateColumnOpen} open={createColumnOpen} projectId={projectId} />

      <TaskSheet
        columnId={activeColumnId}
        members={members}
        onCreated={() => {
          setCreateTaskOpen(false);
          setSelectedTask(null);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setCreateTaskOpen(false);
          }
        }}
        open={createTaskOpen || !!selectedTask}
        projectId={projectId}
        task={currentSelectedTask}
      />
    </Kanban.Root>
  );
};

function useProjectTaskLists(columns: ColumnOutput[]) {
  const taskQueries = useQueries({
    queries: columns.map((column) => ({
      queryKey: taskKeys.list(column.id),
      queryFn: async () => unwrapClientResult(await taskApi.list(column.id)).tasks,
      enabled: !!column.id,
    })),
  });

  return taskQueries.map((query) => query.data ?? []);
}
